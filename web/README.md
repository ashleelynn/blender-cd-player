# UNTZ UNTZ

A Y2K-cyber CD player for the web. Search a song, burn it into your crate, pull the disc out of its sleeve and watch it fly into the player. Built with Vite, React, TypeScript and three.js (react-three-fiber).

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:5173. No API keys or server are needed.

## Pages

| Route | Screen | What works |
| --- | --- | --- |
| `/` | Hero | The player, centered under the top bar and leaning toward the pointer. Click it to open the crate. |
| `/crate` | THE_CRATE | Album sleeves with real cover art. Scroll (or swipe) to flip through, click the middle sleeve to pull its disc and play it. Shuffle picks a random disc. |
| `/play` | NOW_PLAYING | The disc flies from its sleeve into the player, spins and plays the song's 30 second preview. The pink keys work (prev, play/stop, next) and the play icon swaps to stop. The track dial changes songs by scrolling only. |
| `/burn` | BURN_A_MIXTAPE | Search iTunes. + burns a song into the crate (it goes to the front), ✓ takes it out. |

## 3D models

Both models come from the Blender files at the repo root. `public/models/` only holds links to them, so a fresh export from Blender shows up here without copying.

- **`cd_player.glb`**: the player. Its keys, play/stop icons and lid are driven by name (`Button_Prev`, `Button_PlayStop`, `Button_Next`, `Icon_Play`, `Icon_Stop`, `Lid`).
- **`album_sleeve.glb`**: the sleeve. Each disc clones it and puts its cover on `Cover` and `Disc_Label`; the disc slides out by the `peek_distance` / `out_distance` stored on `Disc`. The player uses the same `Disc` on its spindle, because the player's own disc has no UVs for art.

## Music: iTunes Search API

`src/music/itunes.ts` talks to Apple's free iTunes Search API straight from the browser (it allows CORS).

- **Search:** `https://itunes.apple.com/search?term=daft+punk&media=music&entity=song&limit=15&country=US`
- **Lookup by id:** `https://itunes.apple.com/lookup?id=697195462,726320692&country=US`
- **Fields used:** `trackId`, `trackName`, `artistName`, `collectionName`, `releaseDate`, `previewUrl` (30 s AAC), `artworkUrl100` (change `100x100bb` to `600x600bb` for a larger cover) and `trackViewUrl` (the Apple Music link).
- **Limits:** about 20 requests a minute, so searches wait 350 ms after typing stops and are cached. Previews are 30 second clips that Apple picks, often from the chorus.
- **Terms:** previews are for promoting the music, so each song links back to Apple Music ("Listen on Apple Music").

The starter crate (`src/data/seed.ts`) is eight Y2K songs stored by id. On start the app looks them up again so the artwork and preview links stay fresh. The crate is saved in the browser (`localStorage`).

## Fonts

- Instrument Sans comes from `@fontsource/instrument-sans`.
- MD Thermochrome Mono is a **trial** font. Its files in `public/fonts/` are copied from this machine and are git-ignored, so a fresh clone falls back to a system mono font. Buy a web license before deploying.

## Layout

Everything lines up to a 48 px outer margin (`src/layout.ts`). The top bar is the same on every page: logo on the left margin, nav on the right, both on one line. The player is framed by `TopDownFit` (`src/three/Stage.tsx`), which sizes the camera so the player fills the free space under the header at its optical center on any screen size.

## Design tokens

`src/styles/tokens.css` mirrors the Figma variables (colors, spacing, radius, fonts) and text styles, including the `Dial/*` styles.

## Structure

```
src/
  components/  TopBar, SectionHeader, TrackDial, IconButton, Icons
  pages/       Hero, Crate, NowPlaying, Burn
  three/       Stage (canvas, lighting, TopDownFit), PlayerModel, Sleeve (+ CDModel), coverTexture
  music/       iTunes client and the Disc type
  state/       the crate, current disc, playing (saved in localStorage)
  hooks/       useScrollStep (wheel / trackpad / touch -> one step)
  data/        starter crate
  styles/      tokens, fonts, global and page CSS
```
