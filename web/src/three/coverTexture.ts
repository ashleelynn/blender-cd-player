import * as THREE from "three";

const loader = new THREE.TextureLoader().setCrossOrigin("anonymous");
const cache = new Map<string, THREE.Texture>();

/**
 * Album art as a texture for the Blender models. Returns null without a URL, so the
 * model keeps its own art. iTunes artwork is served with CORS, so WebGL can use it.
 */
export function getCoverTexture(url: string | undefined): THREE.Texture | null {
  if (!url) return null;
  let texture = cache.get(url);
  if (!texture) {
    texture = loader.load(url);
    texture.flipY = false; // glTF UVs
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    cache.set(url, texture);
  }
  return texture;
}

/** Puts the art on a mesh by giving it its own copy of the material. Returns the copy so it can be disposed. */
export function applyArt(mesh: THREE.Object3D | undefined, texture: THREE.Texture | null) {
  if (!texture || !(mesh instanceof THREE.Mesh)) return null;
  const material = (mesh.material as THREE.MeshStandardMaterial).clone();
  material.map = texture;
  mesh.material = material;
  return material;
}
