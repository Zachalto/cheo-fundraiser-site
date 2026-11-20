# Minutes That Matter

Live site: https://minutes-that-matter.vercel.app

This is the website for our BOH4M "Minute to Win It" fundraiser for CHEO. It's a static site. It doesn't track anyone, doesn't use cookies and doesn't take payments. Sign-up goes through a Google Form. The only thing saved online is the mini-game leaderboard (a name and a score), which lives in a free Supabase database.

## Updating the site

Almost everything on the site comes from one file, `src/config/event.ts`. You don't need to know how to code to change it.

1. Open `src/config/event.ts`. You can do this right on GitHub: click the file, then the pencil icon.
2. Change the text between the quotes. Leave the quotes and the comma at the end of the line alone.
3. Save it (on GitHub that's "Commit changes"). The site rebuilds itself in about a minute.

### Stuff we haven't decided yet

If something isn't decided, write `null` with no quotes and the site shows a "coming soon" line instead.

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
| `signUpUrl` | The Google Form link. Until it's filled in, the buttons say "Sign-ups open soon" |
| `instagramUrl`, `tiktokUrl` | Footer links |
| `siteUrl` | The site's address. Used for link previews and the Share button |
| `teacherContact` | Footer |
| `games` | The game cards. Each one has a `name`, a `rule`, a `difficulty` from 1 to 5, a joke `difficultyNote`, and an `animation` |
| `cheoText` | The sentences in "Why CHEO". Only put true things here |
| `cheoTodo` | A yellow reminder note in "Why CHEO". Set it to `null` once we've written our own sentence |
| `goal`, `raisedSoFar` | The thermometer. Plain numbers, no `$` and no quotes |
| `faq` | The questions and answers |
| `sponsors` | The sponsor cards. If the list is empty it shows a "looking for sponsors" note |
| `leaderboard` | Database address and key, how many finalists, the prize, the closing time |

`animation` has to be one of `"cups"`, `"cookie"`, `"pingpong"` or `"balloons"`.

## The leaderboard

The cup stacking game has a shared leaderboard. After a round, people type a name and their score gets posted. Whoever's in the top 5 when it closes plays the game live at the event, and the best live score wins the prize. We only use the online board to pick who plays live, because anyone who knows what they're doing can fake a score in a browser game.

It runs on a free Supabase project called `cheo-leaderboard` (Canada region). It's already set up and connected. The address and key in the `leaderboard` part of `src/config/event.ts` are fine to be public, but never paste the secret or service_role key anywhere in this project. Fill in `prize` and `closes` there too once we know them.

If you ever have to rebuild it in a new Supabase project, open the SQL Editor, paste in all of `supabase/leaderboard.sql` and run it. Then copy the Project URL and the publishable key from Project Settings > API into the config.

### Figuring out who's who

Every phone that posts a score gets a six-character claim code. The player sees it under the leaderboard, but it never shows up publicly. Players can also type their homeroom if they want, and that stays private too.

To check a finalist, go to the Supabase dashboard > Table Editor > `scores`, find their row, and ask them to show you the same claim code on their phone. The homeroom column makes it easier to track them down before the event.

### Cheaters and bots

A score only counts if the database saw that round start about a minute before, and each round can only be used once. So someone sending fake scores has to wait a minute for every try.

Some posts get flagged. The person is told it worked, but their row never shows up on the board. That happens when the score is higher than anyone could actually get, when it doesn't match the number of cups landed, when a bot fills in a hidden form field, or when one phone posts more than five times in ten minutes. You can see flagged posts in Table Editor > `scores` under the `flagged` and `flag_reason` columns, along with their claim code and homeroom.

To hide a rude name, set `flagged` to true on that row. If a flagged score looks legit, set it back to false.

None of this makes the game impossible to cheat. Someone who really wants to can still fake a believable score, which is why the prize gets decided live.

### Security headers

`vercel.json` tells browsers to only run the site's own code, only talk to the leaderboard database, and never load the site inside another page. `npm run preview` uses the same rules, so test there before pushing.

If we ever switch to a different Supabase project, the address has to be changed in `vercel.json` and in the config file. Otherwise the leaderboard gets blocked.

### Keeping an eye on it

To remove a name, go to the Supabase dashboard > Table Editor > `scores`, tick the row and delete it. There's a bad-word filter, but someone will get around it eventually, so check the board every so often.

To close the leaderboard, set `supabaseUrl` back to `null` and push. Screenshot the top 5 first.

For each score it saves the name, the score, the time, the homeroom (if they gave one), the claim code and how many cups they landed. It doesn't save anything about people who just visit the site. Make sure the teacher knows the site stores names that students type in.

Free Supabase projects pause after about a week of no activity. If the board stops loading, open the dashboard and unpause it.

## CHEO logo

The site doesn't use CHEO's logo, and we shouldn't add it until CHEO says yes in writing. If they do, the file goes in `public/cheo/`.

## The share image

`public/og-image.png` is the picture that shows up when someone posts or texts the link. If the event name or tagline changes, remake it using the note at the top of `tools/og-template.html`.

## Hosting

The site is hosted on Vercel and connected to this GitHub repo, so every push to `main` goes live in about a minute. You don't have to do anything else.

If it ever needs to be set up again from scratch: sign in to [vercel.com](https://vercel.com) with GitHub, click Add New > Project, pick this repo and hit Deploy. The build settings are already in `vercel.json`. If the address changes, update `siteUrl` in the config so link previews still work.

## Running it on your own computer

You need [Node.js](https://nodejs.org) 20 or newer.

```
npm install
npm run dev       # live preview while you edit
npm run build     # builds the final site into dist/
npm run preview   # serves the built site at http://localhost:4173
```

## How it's built

It's Vite, React and TypeScript. The cup pyramid at the top uses three.js through react-three-fiber, with Rapier for the physics. It loads after the rest of the page, and only on phones that can handle it. On a weak phone, on data saver, with no WebGL or with "reduce motion" turned on, you get a drawing of the pyramid instead and the looping animations stop. To force one or the other while testing, add `?3d=off` or `?3d=on` to the address.

The mini-game is just a canvas. Your best score is saved in your browser and nowhere else.

```
src/config/event.ts   all the content
src/components/       one file per section of the page
src/three/            the 3D cup scene
src/game/             the mini-game rules and drawing
src/styles/global.css colours, fonts and layout
tools/                the share image template
```
