# Minutes That Matter

The website for the BOH4M class "Minute to Win It" fundraiser for CHEO. It is a static site: no backend, no database, no analytics, no cookies, no payments. Sign-up is a link out to a Google Form.

## How to update the site

Almost everything you see on the site comes from one file: `src/config/event.ts`. You don't need to know how to code to change it.

1. Open `src/config/event.ts`. On GitHub you can do this in the browser: click the file, then the pencil icon.
2. Change the text between the quotes. Keep the quotes and the comma at the end of the line.
3. Save (on GitHub: "Commit changes"). If the site is connected to Vercel, it rebuilds itself in about a minute.

### Things that aren't decided yet

If something isn't decided, write `null` with no quotes. The site shows a "coming soon" line in its place.

```ts
date: null,               // shows "Date dropping soon"
date: "Thursday, May 7",  // shows "Thursday, May 7"
```

### What each setting does

| Setting | What it changes |
| --- | --- |
| `name` | The event name, everywhere |
| `logoSrc` | Put a logo file in `public/` and write its name here, like `"/logo.svg"`, to replace the text name |
| `tagline` | The red line under the name |
| `date`, `time`, `location`, `price`, `whoCanPlay` | The cards in "The basics" |
| `signUpUrl` | The Google Form link. Until this is filled in, the buttons say "Sign-ups open soon" |
| `instagramUrl`, `tiktokUrl` | Footer links |
| `siteUrl` | The site's address once it's live. Used for link previews and the Share button |
| `teacherContact` | Footer |
| `games` | The game cards. Each has a `name`, a `rule`, a `difficulty` from 1 to 5, a joke `difficultyNote`, and an `animation` |
| `cheoText` | The sentences in "Why CHEO". Only write things that are true |
| `cheoTodo` | A yellow reminder note in "Why CHEO". Set it to `null` once the class has written its own sentence |
| `goal`, `raisedSoFar` | The thermometer. Plain numbers, no `$` and no quotes |
| `faq` | The questions and answers |

For `animation`, pick one of `"cups"`, `"cookie"`, `"pingpong"` or `"balloons"`.

### CHEO logo

The site does not use CHEO's logo. Don't add one until CHEO has given permission in writing. The folder `public/cheo/` is where an approved file would go.

### The share image

`public/og-image.png` is the picture that appears when the link is posted or texted. If the event name or tagline changes, remake it by following the note at the top of `tools/og-template.html`.

## Deploy on Vercel (free)

1. Make a free account at [github.com](https://github.com) and create a new empty repository.
2. In this folder, run:
   ```
   git add .
   git commit -m "First version"
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
   git push -u origin main
   ```
3. Go to [vercel.com](https://vercel.com), sign up with your GitHub account, and click **Add New > Project**.
4. Pick the repository. Vercel detects Vite by itself. Leave the settings as they are (build command `npm run build`, output folder `dist`) and click **Deploy**.
5. When it finishes, Vercel gives you an address like `your-project.vercel.app`. Put that address in `siteUrl` in the config file and push again, so link previews and the Share button use it.

After that, every push to `main` updates the live site.

## Run it on your own computer

You need [Node.js](https://nodejs.org) 20 or newer.

```
npm install
npm run dev       # live preview while you edit
npm run build     # makes the final site in dist/
npm run preview   # serves the built site at http://localhost:4173
```

## How it's built

- Vite, React and TypeScript.
- The hero cup pyramid uses three.js through react-three-fiber, with Rapier for physics. It loads after the rest of the page, and only on phones that can handle it.
- If the phone is weak, on data saver, has no WebGL, or has "reduce motion" turned on, the site shows an illustration of the pyramid and turns off the looping animations.
- Add `?3d=off` or `?3d=on` to the address to force the illustration or the 3D scene when testing.
- The mini-game is a plain canvas. The best score is kept in the browser's local storage and nowhere else.

```
src/config/event.ts   all the content
src/components/       one file per section of the page
src/three/            the 3D cup scene
src/game/             the mini-game rules and drawing
src/styles/global.css colours, fonts and layout
tools/                the share image template
```
