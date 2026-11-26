# Blender CD Player

A portable CD player modeled in Blender 5.3: a clear glass body with a visible circuit board, a small CRT screen and hot pink keys.

![Hero render](renders/cd_player_hero.png)

## Files

| File | What it is |
| --- | --- |
| `cd_player.blend` | Source scene, including the camera, studio lights and bloom setup |
| `cd_player.glb` | Web/realtime export (glass, clear coat, glowing CRT, part names) |
| `cd_player.obj` + `cd_player.mtl` + `textures/` | OBJ export. Glass is approximated with transparency |
| `renders/` | Hero renders (`cd_player_hero_teal.png` is an earlier design) |
| `versions/cd_player_v1_teal.blend` | Earlier teal Y2K version |

## Model

- **Size:** 140 × 180 × 26 mm, real scale in meters
- **Parts:** body, lid, disc, spindle, deck ring, CRT display, nine keys, OPEN slider, volume wheel, five labelled sockets, plus a detailed circuit board and mechanism inside
- **Editable text:** the lid label (`Text_Label`), socket labels, board labels and chip markings are Blender text objects

## Using it on the web

Every part exports as its own named node in the GLB, for example `Disc`, `Spindle`, `Lid`, `Button_Play`, `Button_Open` and `CRT_Screen`.

- The GLB is Y-up, so the disc spins around **Y** in three.js.
- `Lid` pivots on its back hinge and opens with a negative rotation around X.
- `CRT_Screen` has UVs, so its texture can be swapped for a live visualizer.
- `Disc` has no UV map yet. Add one before applying album art.
- Use an environment map for the chrome and glass, and a bloom pass for the glow.

## Opening

Open `cd_player.blend` in Blender 5.3 or newer. Press **F12** to render the hero camera in Cycles.
