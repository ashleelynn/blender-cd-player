# UNTZ UNTZ

A Y2K-cyber CD player for the web. Pick a disc from the crate, watch it fly into the player and spin. Built with Vite, React, TypeScript and three.js (react-three-fiber).

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

## Pages

| Route | Screen | What works |
| --- | --- | --- |
| `/` | Hero | Logo, _PLAY / _BURN nav, the 3D player leaning toward the pointer. Click it to open the crate. |
| `/crate` | THE_CRATE | 3D sleeves in a row. Scroll (or swipe) to flip through, click the middle sleeve to pull its disc and play it. Shuffle picks a random disc. |
| `/play` | NOW_PLAYING | The disc flies from its sleeve into the player and spins. The pink keys work (prev, play/stop, next) and the play icon swaps to stop. The track dial on the right changes tracks by scrolling only. |
| `/burn` | BURN_A_MIXTAPE | "Coming soon". |

## What is a placeholder

- **Sleeves and CDs** (`src/three/Sleeve.tsx`, `src/three/CD.tsx`): simple three.js shapes at real size with gray "X" cover art. Their part names match `album_sleeve.glb` at the repo root (`AlbumSleeve`, `Sleeve`, `Disc`, 130 mm, the disc slides out along +Y), so the GLB can replace them later.
- **Songs** (`src/data/discs.ts`): eight made-up tracks. Each has optional `coverUrl` and `previewUrl` fields. The app already uses them: covers are drawn onto the sleeve and CD label, and previews play when you press play.
- **Audio**: silent until a disc has a `previewUrl`.

The CD player itself is the real Blender model. `public/models/cd_player.glb` links to `cd_player.glb` at the repo root, so a fresh export from Blender shows up here without copying.

## Fonts

- Instrument Sans comes from `@fontsource/instrument-sans`.
- MD Thermochrome Mono is a **trial** font. Its files in `public/fonts/` are copied from this machine and are git-ignored, so a fresh clone falls back to a system mono font. Buy a web license before deploying.

## Design tokens

`src/styles/tokens.css` mirrors the Figma variables (colors, spacing, radius, fonts) and text styles, including the new `Dial/*` styles.

## Structure

```
src/
  components/  TopBar, SectionHeader, TrackDial, IconButton, Icons
  pages/       Hero, Crate, NowPlaying, Burn
  three/       Stage (canvas + lighting), PlayerModel, Sleeve, CD, coverTexture
  state/       tiny store: discs, current disc, playing
  hooks/       useScrollStep (wheel / trackpad / touch -> one step)
  data/        placeholder discs
  styles/      tokens, fonts, global and page CSS
```
