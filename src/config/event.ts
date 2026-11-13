/*
 * ─────────────────────────────────────────────────────────────
 *  THE ONE FILE THAT RUNS THE WHOLE SITE
 * ─────────────────────────────────────────────────────────────
 *  Change the text between the quotes, save, and the site updates.
 *
 *  Not decided yet? Write  null  (no quotes) and the site shows a
 *  friendly "coming soon" line instead of looking broken.
 *
 *    date: null,              ← shows "Date dropping soon"
 *    date: "Thursday, May 7", ← shows "Thursday, May 7"
 */

export type GameAnimation = "cups" | "cookie" | "pingpong" | "balloons";

export interface Game {
  name: string;
  /** One line. How you play. */
  rule: string;
  /** 1 to 5. Shown as little cups. */
  difficulty: 1 | 2 | 3 | 4 | 5;
  /** The joke next to the rating. */
  difficultyNote: string;
  /** Which little looping animation the card shows. */
  animation: GameAnimation;
}

export interface Sponsor {
  name: string;
  /** Their website (optional). */
  url?: string;
  /** Their logo, e.g. "/sponsors/example.png" (optional). Without one, the name is shown as text. */
  logoSrc?: string;
}

export interface Faq {
  question: string;
  answer: string;
}

export const event = {
  // ── The name ───────────────────────────────────────────────
  name: "Minutes That Matter",
  /** Optional logo image, e.g. "/logo.svg" (put the file in /public). null = text wordmark. */
  logoSrc: null as string | null,

  // ── The one-line pitch under the name ──────────────────────
  // Alternatives we liked:
  //   "60 seconds. Red cups. Zero dignity."
  //   "Extremely serious cup games. For a seriously good cause."
  tagline: "The most intense minute of your lunch.",

  charity: "CHEO",
  classCode: "BOH4M",

  // ── The basics (null = not decided yet) ────────────────────
  date: null as string | null, // e.g. "Thursday, May 7"
  time: null as string | null, // e.g. "11:35 – 12:25"
  location: null as string | null, // e.g. "Main gym"
  price: null as string | null, // e.g. "$5"
  whoCanPlay: "Any student",

  // ── Links (null = not ready yet) ───────────────────────────
  signUpUrl: null as string | null, // the Google Form link
  instagramUrl: null as string | null,
  tiktokUrl: null as string | null,
  /** The live address of this site, e.g. "https://minutes-that-matter.vercel.app". Needed for link previews. */
  siteUrl: null as string | null,
  /** e.g. "Ms. Example — example@school.ca" */
  teacherContact: null as string | null,

  // ── The games ──────────────────────────────────────────────
  games: [
    {
      name: "Stack Attack",
      rule: "Build a cup pyramid, then take it back down to one stack before the buzzer.",
      difficulty: 3,
      difficultyNote: "your hands will shake by second 40",
      animation: "cups",
    },
    {
      name: "Face the Cookie",
      rule: "Get a cookie from your forehead to your mouth without using your hands.",
      difficulty: 4,
      difficultyNote: "it falls off. it always falls off",
      animation: "cookie",
    },
    {
      name: "Bounce House",
      rule: "Bounce ping pong balls off the table and into the cups.",
      difficulty: 5,
      difficultyNote: "the ball does whatever it wants",
      animation: "pingpong",
    },
    {
      name: "Defying Gravity",
      rule: "Keep three balloons off the floor for the full minute.",
      difficulty: 2,
      difficultyNote: "fine until somebody sneezes",
      animation: "balloons",
    },
  ] as Game[],

  // ── Why CHEO ───────────────────────────────────────────────
  // Sincere and short. Only write things here that are true and that
  // you can back up. Leave the list empty ( [] ) to show a placeholder.
  cheoText: [
    "The games are silly. The reason we're running them isn't.",
    "The money raised at this event goes to CHEO, the Children's Hospital of Eastern Ontario.",
  ] as string[],
  /** Shown as a clearly marked note until the class writes its own line. Set to null to hide. */
  cheoTodo: "The class still needs to add a sentence here, in our own words, about why we picked CHEO." as
    | string
    | null,
  cheoUrl: "https://www.cheo.on.ca",

  // ── The thermometer (numbers, no $ sign, no quotes) ────────
  goal: 1000,
  raisedSoFar: 0,

  // ── Sponsors ───────────────────────────────────────────────
  // Add one line per sponsor between the [ ]. Only the name is required.
  //   { name: "Example Pizza", url: "https://example.com", logoSrc: "/sponsors/example-pizza.png" },
  // Logo files go in the public/sponsors folder. Only use a logo the sponsor sent you.
  sponsors: [] as Sponsor[],

  // Leaderboard for the cup stacking game. Setup steps are in the README.
  leaderboard: {
    /** From Supabase: Project Settings > API > Project URL. null = leaderboard switched off. */
    supabaseUrl: "https://uhlehrdvolfyetcilupl.supabase.co" as string | null,
    /** From Supabase: the "publishable" (or "anon") key. NEVER paste the "secret" or "service_role" key here. */
    supabaseKey: "sb_publishable_LXg6TBU-uwYA5-Zj_mJ2PA_OFi1u3BU" as string | null,
    /** How many names at the top get to play live at the event. */
    finalists: 5,
    /** e.g. "a $25 gift card". null = "a prize, we'll say what it is soon". */
    prize: null as string | null,
    /** e.g. "Wednesday May 6 at 3pm". null = no closing time shown. */
    closes: null as string | null,
  },

  // ── FAQ ────────────────────────────────────────────────────
  faq: [
    {
      question: "Do I need to be good at this?",
      answer: "No. Most people aren't, which is why it's fun to watch.",
    },
    {
      question: "Where does the money go?",
      answer: "The money we raise goes to CHEO, the Children's Hospital of Eastern Ontario.",
    },
    {
      question: "Can I just watch?",
      answer: "Yes, come watch. It's better with a crowd.",
    },
    {
      question: "What do I win?",
      answer: "Bragging rights for sure. We're still figuring out prizes.",
    },
    {
      question: "How do I sign up?",
      answer: "Tap Sign Up and fill in the form. If the button says sign-ups open soon, the form isn't ready yet.",
    },
  ] as Faq[],
};

export type EventConfig = typeof event;
