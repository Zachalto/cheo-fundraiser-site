import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei/core/PerformanceMonitor.js";
import {
  BallCollider,
  ConvexHullCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  useRapier,
  type RapierRigidBody,
} from "@react-three/rapier";
import {
  BackSide,
  CircleGeometry,
  LatheGeometry,
  MathUtils,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  Quaternion,
  SphereGeometry,
  TorusGeometry,
  Vector2,
  Vector3,
} from "three";
import { forced3D } from "../lib/device";
import { useInView } from "../lib/useInView";

/* ── Shapes and materials, made once and shared by every cup ── */
const RIM_R = 0.4;
const BASE_R = 0.27;
const CUP_H = 1;
const HALF = CUP_H / 2;

// An upside-down cup: wide open rim at the bottom, closed narrow end on top.
const cupGeo = new LatheGeometry(
  [new Vector2(RIM_R, -HALF), new Vector2(BASE_R, HALF), new Vector2(0, HALF)],
  20,
);
const rimGeo = new TorusGeometry(RIM_R, 0.035, 6, 20).rotateX(Math.PI / 2).translate(0, -HALF + 0.035, 0);
const ballGeo = new SphereGeometry(0.13, 14, 10);
const shadowGeo = new CircleGeometry(1, 24).rotateX(-Math.PI / 2);

const redMat = new MeshStandardMaterial({ color: "#d7141a", roughness: 0.45 });
const insideMat = new MeshStandardMaterial({ color: "#fff6e5", roughness: 0.7, side: BackSide });
const whiteMat = new MeshStandardMaterial({ color: "#ffffff", roughness: 0.4 });
const tableMat = new MeshStandardMaterial({ color: "#14110f", roughness: 0.8 });
const shadowMat = new MeshBasicMaterial({ color: "#000000", transparent: true, opacity: 0.28 });

const HULL = (() => {
  const pts: number[] = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    pts.push(Math.cos(a) * (RIM_R + 0.03), -HALF, Math.sin(a) * (RIM_R + 0.03));
    pts.push(Math.cos(a) * BASE_R, HALF, Math.sin(a) * BASE_R);
  }
  return new Float32Array(pts);
})();

/* ── Where each cup lives in the pyramid: rows of 4, 3, 2, 1 ── */
const SPACING = 0.87;
const HOMES: Vector3[] = [];
[4, 3, 2, 1].forEach((count, row) => {
  for (let i = 0; i < count; i++) {
    HOMES.push(new Vector3((i - (count - 1) / 2) * SPACING, HALF + row * CUP_H + 0.005, 0));
  }
});
const BALL_STARTS = [new Vector3(-2.6, 4.2, 0.9), new Vector3(2.7, 5.4, 0.95)];
const UPRIGHT = new Quaternion();
const LOOK_AT = new Vector3(0, 1.85, 0);
const FOV = 32;

interface Restack {
  t0: number;
  from: { pos: Vector3; rot: Quaternion }[];
}

export interface SceneApi {
  knock: () => void;
  restack: () => void;
}

function Scene({ apiRef, onMess, onReady }: {
  apiRef: RefObject<SceneApi | null>;
  onMess: () => void;
  onReady: () => void;
}) {
  const { rapier } = useRapier();
  const cups = useRef<(RapierRigidBody | null)[]>([]);
  const balls = useRef<(RapierRigidBody | null)[]>([]);
  const restack = useRef<Restack | null>(null);
  const lastHit = useRef(0);
  const tmp = useMemo(() => ({ pos: new Vector3(), rot: new Quaternion(), dir: new Vector3() }), []);

  const dropBalls = useCallback(() => {
    balls.current.forEach((b, i) => {
      if (!b) return;
      b.setTranslation(BALL_STARTS[i], true);
      b.setLinvel({ x: i === 0 ? 1.1 : -1.3, y: 0, z: 0 }, true);
      b.setAngvel({ x: 0, y: 0, z: 0 }, true);
    });
  }, []);

  useEffect(() => {
    apiRef.current = {
      knock() {
        // Kick out a bottom cup and let gravity do the rest.
        const target = cups.current[1];
        target?.applyImpulse({ x: 0.6, y: 0.3, z: -1.6 }, true);
        cups.current[2]?.applyImpulse({ x: -0.4, y: 0.2, z: -1.1 }, true);
        onMess();
      },
      restack() {
        if (restack.current) return;
        const from = cups.current.map((b) => {
          const t = b!.translation();
          const r = b!.rotation();
          b!.setBodyType(rapier.RigidBodyType.KinematicPositionBased, true);
          return { pos: new Vector3(t.x, t.y, t.z), rot: new Quaternion(r.x, r.y, r.z, r.w) };
        });
        restack.current = { t0: performance.now(), from };
      },
    };
    onReady();
    return () => {
      apiRef.current = null;
    };
  }, [apiRef, onMess, onReady, rapier]);

  // Restack: each cup flies home in a little arc, bottom row first.
  useFrame(() => {
    const job = restack.current;
    if (!job) return;
    const elapsed = (performance.now() - job.t0) / 1000;
    let allHome = true;
    cups.current.forEach((body, i) => {
      if (!body) return;
      const t = MathUtils.clamp((elapsed - i * 0.07) / 0.5, 0, 1);
      if (t < 1) allHome = false;
      const ease = 1 - Math.pow(1 - t, 3);
      tmp.pos.lerpVectors(job.from[i].pos, HOMES[i], ease);
      tmp.pos.y += Math.sin(Math.PI * t) * 0.9;
      tmp.rot.slerpQuaternions(job.from[i].rot, UPRIGHT, ease);
      body.setNextKinematicTranslation(tmp.pos);
      body.setNextKinematicRotation(tmp.rot);
    });
    if (allHome) {
      cups.current.forEach((body, i) => {
        if (!body) return;
        body.setBodyType(rapier.RigidBodyType.Dynamic, true);
        body.setTranslation(HOMES[i], true);
        body.setRotation(UPRIGHT, true);
        body.setLinvel({ x: 0, y: 0, z: 0 }, true);
        body.setAngvel({ x: 0, y: 0, z: 0 }, true);
      });
      restack.current = null;
      dropBalls();
    }
  });

  function hit(e: ThreeEvent<PointerEvent>, index: number, strength: number) {
    const body = cups.current[index];
    if (!body || restack.current) return;
    e.stopPropagation();
    const sideways = MathUtils.clamp(e.nativeEvent.movementX * 0.04, -0.9, 0.9) || (Math.random() - 0.5) * 0.7;
    tmp.dir.copy(e.ray.direction).setY(0.18).setX(e.ray.direction.x + sideways).normalize().multiplyScalar(strength);
    body.applyImpulseAtPoint(tmp.dir, e.point, true);
    onMess();
  }

  return (
    <>
      {/* Table, plus a floor far below so fallen cups stop instead of falling forever */}
      <RigidBody type="fixed" colliders={false} friction={1}>
        <CuboidCollider args={[3.1, 0.15, 1.3]} position={[0, -0.15, 0]} />
        <CuboidCollider args={[40, 0.5, 40]} position={[0, -9, 0]} />
        <mesh position={[0, -0.15, 0]} material={tableMat}>
          <boxGeometry args={[6.2, 0.3, 2.6]} />
        </mesh>
        <mesh geometry={shadowGeo} material={shadowMat} position={[0, 0.004, 0.1]} scale={[2.1, 1, 0.75]} />
      </RigidBody>

      {HOMES.map((home, i) => (
        <RigidBody
          key={i}
          ref={(b) => {
            cups.current[i] = b;
          }}
          position={home}
          colliders={false}
          friction={0.9}
          restitution={0.3}
          angularDamping={0.35}
        >
          <ConvexHullCollider args={[HULL]} />
          <mesh
            geometry={cupGeo}
            material={redMat}
            onPointerDown={(e) => hit(e, i, 1.15)}
            onPointerMove={(e) => {
              const dragging = e.pointerType === "touch" || e.buttons > 0;
              if (!dragging || performance.now() - lastHit.current < 70) return;
              lastHit.current = performance.now();
              hit(e, i, 0.7);
            }}
          />
          <mesh geometry={cupGeo} material={insideMat} />
          <mesh geometry={rimGeo} material={whiteMat} />
        </RigidBody>
      ))}

      {BALL_STARTS.map((start, i) => (
        <RigidBody
          key={i}
          ref={(b) => {
            balls.current[i] = b;
          }}
          position={start}
          linearVelocity={[i === 0 ? 1.1 : -1.3, 0, 0]}
          colliders={false}
          restitution={0.82}
          friction={0.4}
        >
          <BallCollider args={[0.13]} />
          <mesh geometry={ballGeo} material={whiteMat} />
        </RigidBody>
      ))}
    </>
  );
}

/** Frames the pyramid for any screen shape and drifts a little with scroll, mouse or tilt. */
function CameraRig() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const aspect = useThree((s) => s.size.width / s.size.height);
  const sway = useRef({ x: 0, scroll: 0 });

  useEffect(() => {
    const onScroll = () => (sway.current.scroll = Math.min(1, scrollY / 600));
    const onMouse = (e: PointerEvent) => {
      if (e.pointerType === "mouse") sway.current.x = (e.clientX / innerWidth - 0.5) * 2;
    };
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma != null) sway.current.x = MathUtils.clamp(e.gamma / 30, -1, 1);
    };
    // iPhones show a permission pop-up for tilt, so only use it where it's free.
    const Tilt = window.DeviceOrientationEvent as (typeof DeviceOrientationEvent & { requestPermission?: unknown }) | undefined;
    const tiltIsFree = !!Tilt && typeof Tilt.requestPermission !== "function";

    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("pointermove", onMouse, { passive: true });
    if (tiltIsFree) addEventListener("deviceorientation", onTilt);
    return () => {
      removeEventListener("scroll", onScroll);
      removeEventListener("pointermove", onMouse);
      removeEventListener("deviceorientation", onTilt);
    };
  }, []);

  useFrame((_, dt) => {
    const tan = Math.tan(MathUtils.degToRad(FOV / 2));
    const dist = Math.max(2.8 / tan, 2.5 / (tan * aspect));
    const k = 1 - Math.exp(-dt * 4);
    camera.position.x = MathUtils.lerp(camera.position.x, sway.current.x * 0.9, k);
    camera.position.y = MathUtils.lerp(camera.position.y, 2.5 + sway.current.scroll * 1.4, k);
    camera.position.z = MathUtils.lerp(camera.position.z, dist, k);
    camera.lookAt(LOOK_AT);
  });
  return null;
}

export default function CupScene({ onGiveUp }: { onGiveUp: () => void }) {
  const [wrapRef, inView] = useInView<HTMLDivElement>(false, 0.05);
  const [tabVisible, setTabVisible] = useState(!document.hidden);
  const [dpr, setDpr] = useState(() => Math.min(1.5, window.devicePixelRatio || 1));
  const [ready, setReady] = useState(false);
  const [messy, setMessy] = useState(false);
  const [touched, setTouched] = useState(false);
  const api = useRef<SceneApi | null>(null);
  const declines = useRef(0);
  const active = inView && tabVisible;

  useEffect(() => {
    const onVis = () => setTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const onMess = useCallback(() => {
    setMessy(true);
    setTouched(true);
  }, []);
  const onReady = useCallback(() => setReady(true), []);

  // If the phone can't keep up: first drop the resolution, then switch to the illustration.
  const onDecline = useCallback(() => {
    if (forced3D() === "on") return;
    declines.current += 1;
    if (declines.current === 1) setDpr(1);
    else onGiveUp();
  }, [onGiveUp]);

  return (
    <div className="scene3d" ref={wrapRef}>
      <Canvas
        className="scene3d__canvas"
        dpr={dpr}
        frameloop={active ? "always" : "never"}
        camera={{ fov: FOV, position: [0, 2.5, 9], near: 0.5, far: 60 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        role="img"
        aria-label="A pyramid of red party cups you can knock over."
      >
        <hemisphereLight args={["#ffffff", "#ffd9cf", 1.5]} />
        <directionalLight position={[3, 6, 5]} intensity={2.2} />
        <CameraRig />
        <PerformanceMonitor bounds={() => [35, 62]} onDecline={onDecline} />
        <Physics gravity={[0, -22, 0]} paused={!active}>
          <Scene apiRef={api} onMess={onMess} onReady={onReady} />
        </Physics>
      </Canvas>

      {ready && !touched && <p className="scene3d__hint">Tap or swipe the cups</p>}
      <button
        type="button"
        className="btn btn--sm scene3d__btn"
        disabled={!ready}
        onClick={() => {
          if (messy) {
            api.current?.restack();
            setMessy(false);
          } else {
            api.current?.knock();
          }
        }}
      >
        {messy ? "Restack" : "Knock it over"}
      </button>
    </div>
  );
}
