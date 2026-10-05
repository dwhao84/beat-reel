# beat-reel — the portable contract

**Read this if you are not Claude Code.** Codex, Gemini, Cursor, another model,
a plain script, a human: this file is the whole job. Every step below is a
command you can run, not advice you have to remember.

It sits at the repo root because that is where your tool looks. All commands
assume you are at the repo root unless stated otherwise.

The job: **a folder of phone photos and clips → one 1080×1920 mp4 whose cuts land
on the music's beats.** Photo-led. Rendered by Remotion (React), not by an
ffmpeg filter graph.

---

## The one thing to understand before you start

**The user shoots. You select.** They hand over a folder; deciding which shots
earn a place, in what order, and how long the result runs *is* the edit. Do not
hand the contact sheets back and ask them to pick — that is the work you were
asked to do.

Two things you must ask about, because you were not there:

- **Text on screen you cannot read** — a shop sign, a venue name, an exhibition title.
- **Place names you are only inferring from the picture.** Write your best guess
  in, then say plainly which ones are guesses. A wrong place name is worse than none.

## Setup

```bash
# required
brew install ffmpeg node          # or your platform's equivalent

# required for the triage/review scripts
python3 -m venv .venv && .venv/bin/pip install Pillow
```

Homebrew's slim `ffmpeg` has no `drawtext` and no libass. **That is fine** —
nothing here burns text with ffmpeg. All text is drawn by Pillow or laid out by
Remotion. Do not "fix" it by reaching for `drawtext`; it will not be there.

Verify:

```bash
ffmpeg -version >/dev/null && echo "ffmpeg ok"
.venv/bin/python -c "import PIL; print('Pillow ok')"
node --version
```

---

## Step 1 — Triage the folder

```bash
.venv/bin/python skills/beat-reel/scripts/triage.py <SOURCE_DIR> <WORK_DIR>
```

Example output:

```
raw: 210 photos, 118 videos
photos deduped: 210 → 83 (127 merged)
contact sheets: 4 → <WORK_DIR>/sheet*.jpg
videos: 118 → 55 unique
filmstrips: 10 → <WORK_DIR>/vstrip*.jpg
```

Produces, in `<WORK_DIR>`:

| File | What it is |
|---|---|
| `sheet*.jpg` | Numbered contact sheets, 25 photos per sheet |
| `vstrip*.jpg` | Video filmstrips — frames sampled at even intervals, each labelled with its timestamp |
| `index.txt` | `NNN  filename  WxH  capture-time` |
| `videos.txt` | `filename|WxH|portrait-or-landscape|codec|duration` |
| `dupes.txt` | Which frames were merged as duplicates and which one survived |

**Do not skip this and `ls` the folder instead.** Filenames do not sort into
chronological order (a folder typically mixes `IMG_1234`,
`Flow_IMG_20260217_112821_01_040` and `att.<hash>.jpeg`), and roughly half of a
phone folder is burst shots and screenshots. The script sorts by capture time and
merges bursts with a perceptual hash, keeping the sharpest frame of each group.

## Step 2 — Look at the sheets, then select

**Open `sheet*.jpg` and `vstrip*.jpg` as images and actually look at them.** If
your tool can read images, read them. If it cannot, say so and ask the user to
pick — do not guess from filenames.

Always cut:

- Screenshots: boarding passes, eSIM setup, hotel bookings, maps, chat logs.
  Those are documents, not scenery.
- Shots of the ground, of the photographer's own clothing, or rotated 90°.
  Wearable-camera footage is full of these.
- The third-and-beyond shot of a single scene. The script merges near-identical
  frames; "same wall, different pose" it cannot merge — that judgement is yours.

For clips: **a ten-minute video may contain three usable seconds.** Use the
filmstrip to find them. Length is not value.

Order: follow the trip chronologically, with one or two of the strongest shots up
front as a hook. **Use a full-bleed portrait shot for the hook** — the opening
title lands on top of the first shot, and type over a full-bleed photo reads far
better than type over a blurred backdrop.

A 30–45 second reel is comfortable. Past a minute you need a reason.

## Step 3 — Create the project and stage the files

If there is no project yet, copy the template out and install:

```bash
cp -R skills/beat-reel/assets/template <PROJECT_DIR>
cd <PROJECT_DIR> && npm install
```

Then, from `<PROJECT_DIR>`:

```bash
mkdir -p public/photos/<trip> public/videos/<trip>
cp <SOURCE_DIR>/<chosen>.jpeg public/photos/<trip>/

# clips: remux .mov → .mp4 (stream copy, no quality loss)
.venv/bin/python <REPO>/skills/beat-reel/scripts/prep_clips.py \
    public/videos/<trip> a.mov b.mov

# long sources: cut the segment you need first
.venv/bin/python <REPO>/skills/beat-reel/scripts/prep_clips.py \
    public/videos/<trip> long.mov --from 155 --dur 12 --name landing
```

Why remux: rendering pulls frames with ffmpeg and handles `.mov` fine, but the
Studio preview is **a browser playing the file**, where `.mov` is not reliable.

Why trim: carrying a ten-minute source into `public/` to use three seconds of it
bloats the bundle and makes every Studio reload slow.

## Step 4 — Write the trip config

One file per trip at `src/trips/<name>.ts`, registered in the `TRIPS` array in
`src/trips/index.ts`. `Root.tsx` registers one composition per trip
automatically. **Leave existing trips alone** — the structure exists so that last
month's reel still renders.

```ts
import type { Trip } from "../types";

export const okinawa: Trip = {
  id: "Okinawa",            // composition id — what you pass to the renderer
  title: "沖繩",
  subtitle: "OKINAWA",
  dir: "okinawa",           // public/photos/<dir>/ and public/videos/<dir>/
  bpm: 174,                 // the song's BPM; cuts land on this
  beatsPerPhoto: 4,         // plain shot  → 1.38s
  beatsPerCaptioned: 7,     // with caption → 2.41s
  transitionFrames: 10,     // cross-fade  → 0.33s
  shots: [
    { src: "hook.jpeg", caption: "" },
    { src: "wide.jpeg", caption: "首里城", captionEn: "Shuri Castle", fit: "contain" },
    { video: "street.mp4", from: 3, caption: "", beats: 8 },
    { src: "selfie.jpeg", caption: "出發",
      faces: [{ emoji: "😎", x: 0.69, y: 0.42, size: 0.37 }] },
  ],
};
```

Full field definitions: `assets/template/src/types.ts`.
A finished config to copy the shape from: `references/examples/singapore.ts`.

### The four rules you cannot get right by guessing

These are the ones that produce an obviously broken reel if you ignore them.
The reasoning for all of them, plus everything else, is in
**[`skills/beat-reel/references/craft.md`](skills/beat-reel/references/craft.md)
— read it before writing the config.**

**1. Landscape material always gets `fit: "contain"`.** A 16:9 photo filling a
9:16 frame keeps only the middle third of its width. Whatever was at the left and
right edges — which is usually the subject — is gone. `contain` keeps the whole
photo, with the same photo scaled up and blurred behind it. Portrait photos use
the default `cover`.

**2. Round once, after accumulating beats.** At 174 BPM and 30 fps a beat is
10.34 frames — not an integer. Rounding per shot and summing lets the error pile
up until the end of the reel drifts off the music. `config.ts` already does this
correctly in `cutFrames()`; do not rewrite it to round per shot.

**3. Transition length scales with shot length.** Four frames suits a 0.69s shot.
Left at four when shots run 1.4s, every cut becomes "settle in… *snap*". Shots
over ~1.4s want 10 frames.

**4. "Too fast" means fewer shots, not a longer reel.** If the user says the cuts
are too quick, cut shots — same runtime, fewer and longer. Raising the beat counts
without removing shots just makes the reel longer, which is not what they asked
for. Never change `bpm` to adjust pacing; the BPM belongs to the song.

## Step 5 — Render

```bash
npx remotion compositions src/index.ts                        # sanity-check length first
npx remotion render src/index.ts Okinawa out/okinawa.mp4 --log=error
```

A one-minute reel takes roughly two to four minutes — Remotion draws every frame
in a headless browser. That is normal; do not assume it has hung.

For one frame, which is much faster than a full render:

```bash
npx remotion still src/index.ts Okinawa /tmp/check.png --frame=300
```

## Step 6 — Look at the output before you deliver it

**This step is not optional, and it is the one most likely to be skipped.**
Captions overflow the frame, emoji drift off faces, contained photos end up as a
thin strip, transitions turn to mush. None of that is visible in the code — only
in the pixels.

```bash
for t in 1 5 10 15 20 25 30 35 40; do
  ffmpeg -nostdin -loglevel error -y -ss $t -i out/okinawa.mp4 -frames:v 1 /tmp/f$t.jpg
done
```

Tile them into one grid with Pillow and read it (the snippet is at the end of
`craft.md`). Check specifically:

- every captioned shot — text inside the frame, the two language lines not colliding
- every shot with `faces` — emoji still on the face, no chin showing
- the midpoint of a few transitions — the dissolve not a smear

If you changed anything shared (`config.ts`, `components/`), render one frame of
an **older** trip too, to confirm you did not break it.

## Step 7 — Report honestly

State: runtime, shot count, **which place names you were guessing at**, and any
material that is visibly lower quality (an upscaled low-resolution source, a
frame grabbed from shaky video). If you dropped something the user asked for, say
so and why.

---

## Reference map

| File | Read it when |
|---|---|
| `skills/beat-reel/references/craft.md` | **Before writing a config.** Layout, pacing, transitions, captions, face covers — all with reasons |
| `skills/beat-reel/references/troubleshooting.md` | A render fails, or the picture looks wrong |
| `skills/beat-reel/references/examples/singapore.ts` | You want to see a finished config |
| `skills/beat-reel/assets/template/src/types.ts` | You need the exact fields on `Trip` / `Shot` / `Face` |
| `skills/beat-reel/SKILL.md` | The same workflow written for Claude Code. Same content, shorter |
| `README.en.md` | Background, figures explaining the layout and the beat grid |

## What this repo does not do

**Talking-head video.** No speech recognition, no word-timed captions, no silence
trimming, no ducking against a voice. If the material is someone speaking to
camera, say so and stop — this is the wrong tool, and faking it produces a worse
result than admitting it.

**Music.** The output is silent by design; music goes on in the publishing app.
The cuts are already on the grid, so it lines up — provided the track has the BPM
in the config.

**Automatic selection.** Deliberately. What makes a shot good is not in the
pixels. The tooling turns two hundred photos into eighty; the last thirty are a
judgement call, and it is yours to make and to explain.
