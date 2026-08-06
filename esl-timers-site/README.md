# ClassCarnival — Classroom Timer Tools

Free, no-login classroom timer tools for teachers: race timer, team race, stopwatch, countdown, and random name picker. Static site, no build step, no framework. Every tool page includes a unique "About this tool" section (Phase 0 of the launch plan — real descriptive content, needed for both SEO and AdSense approval).

## Structure

```
index.html              Homepage with links to every tool
css/theme.css            Shared design tokens, nav, buttons, panels — edit once, applies everywhere
tools/race-timer.html    Random race to decide student order
tools/team-race.html     Click-to-advance team competition race
tools/stopwatch.html     Stopwatch with laps
tools/countdown.html     Countdown timer with presets + alarm
tools/name-picker.html   Random name picker, no repeats until everyone's picked
robots.txt / sitemap.xml SEO basics — already pointed at classcarnival.com
```

## Running it locally

No build tools needed. Just open `index.html` in a browser, or serve it locally:

```
npx serve .
```

## Deploying

Push this folder to a GitHub repo, then connect it to Vercel or Netlify (both have free tiers and support plain static sites with zero config). Point your custom domain at it once you have one.

## Adding AdSense later

1. Apply for Google AdSense once the site has been live with real content for a while (it needs a real domain, not localhost).
2. Once approved, add your `ads.txt` file at the site root with the line Google gives you.
3. Add the AdSense script tag to each page's `<head>`, and drop `<ins class="adsbygoogle">` ad units in `css/theme.css`-styled containers — a good spot is directly below the `.page-header` on each tool page.

## The race skin system

`tools/race-timer.html`, `ninja-race.html`, `dinosaur-race.html`, `word-race.html`, and `sushi-dumpling-race.html` all run on the same engine (`js/race-engine.js`) and shared styles (`css/race-shared.css`). Each page only supplies:

1. Its own `<title>`, meta description, `<h1>`, and subtitle (keep these unique per page — that's what makes each one rank for its own search term)
2. A small `:root` CSS override for `--track-bg` and the body background gradient, to give the page its own palette
3. A `window.RACE_SKIN = { avatarType: 'emoji', emoji: '🦆' }` script (or `avatarType: 'initials'` for the plain version) right before the `race-engine.js` script tag

To add a new themed race, copy `tools/dinosaur-race.html`, change the title/meta/H1/subtitle, the `--track-bg` color, and the `RACE_SKIN` emoji. No JS logic to touch. Then add it to `index.html`'s tool grid, the nav on every page, the "Try another theme" links on the other race pages, and `sitemap.xml`.

**Before naming a new theme, check it's not already on onlinestopwatch.com's race timer or name picker lists** (they cover most obvious animal/fantasy/holiday themes) — pick something original instead of an exact-name match.

## The name-picker skin system

`name-picker.html`, `popsicle-stick-picker.html`, `lucky-envelope-picker.html`, and `sticker-jar-picker.html` all use `js/picker-core.js` — a tiny no-repeat pool helper (`createPicker(names)` → `pickNext()`, `reset()`, `isRemaining()`). Each page just renders the pick differently (a plain reveal vs. a tap-to-reveal animation with a different icon).

`spin-globe-picker.html` manages its own pool array directly, since it needs to know a name's wheel position *before* removing it, to animate the spin landing on the right segment — this one isn't built on `picker-core.js`.

To add a new picker mechanic that's just a different reveal animation (e.g. a treasure chest, a slot machine), copy `sticker-jar-picker.html` and swap the icon/animation/markup — it can keep using `picker-core.js` as-is.

## Working in Cursor

Open this folder as your project root in Cursor. To keep new tools visually consistent, always tell Cursor's AI to:
- Reuse `css/theme.css` instead of writing new inline styles for colors, fonts, buttons, or nav
- Copy the `<header class="site-header">...</header>` and `<footer class="site-footer">...</footer>` blocks from an existing tool page
- Add new tools to `index.html`'s `.tool-grid` and to the nav in every page
- Add new URLs to `sitemap.xml`

See the prompt below for kicking off your next tool.
