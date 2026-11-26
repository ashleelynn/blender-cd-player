import * as THREE from "three";
import type { Disc } from "../data/discs";

const SIZE = 512;
const cache = new Map<string, THREE.CanvasTexture>();

/** Placeholder art in the Figma style: light gray square, a thin X and a DISC_0n tag. */
function drawPlaceholder(ctx: CanvasRenderingContext2D, disc: Disc) {
  ctx.fillStyle = "#e2e2de";
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.strokeStyle = "#bdbdb8";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(SIZE, SIZE);
  ctx.moveTo(SIZE, 0);
  ctx.lineTo(0, SIZE);
  ctx.stroke();
  ctx.fillStyle = "#858582";
  ctx.font = '500 22px "MD Thermochrome Mono Trial", ui-monospace, monospace';
  ctx.textBaseline = "alphabetic";
  ctx.fillText(`DISC_${String(disc.no).padStart(2, "0")}`, 28, SIZE - 28);
}

/**
 * Cover art for a disc, shared by its sleeve front and its CD label.
 * Draws the placeholder now; if the disc has a coverUrl it swaps in the real image once it loads.
 */
export function getCoverTexture(disc: Disc): THREE.CanvasTexture {
  const hit = cache.get(disc.id);
  if (hit) return hit;

  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;

  const redraw = () => {
    drawPlaceholder(ctx, disc);
    texture.needsUpdate = true;
  };
  redraw();
  // the trial font may still be loading on first paint
  document.fonts?.load('500 22px "MD Thermochrome Mono Trial"').then(redraw).catch(() => {});

  if (disc.coverUrl) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      ctx.drawImage(img, 0, 0, SIZE, SIZE);
      texture.needsUpdate = true;
    };
    img.src = disc.coverUrl;
  }

  cache.set(disc.id, texture);
  return texture;
}
