import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, type ThreeElements } from "@react-three/fiber";
import type { Disc } from "../data/discs";
import { CD } from "./CD";
import { getCoverTexture } from "./coverTexture";

/** Same contract as album_sleeve.glb: 130 mm square, the disc slides out of the top along +Y. */
export const SLEEVE_SIZE = 0.13;
export const SLIDE = { rest: 0, peek: 0.05, out: 0.13 };
const DEPTH = 0.004;

const cardMaterial = new THREE.MeshStandardMaterial({ color: "#f7f7f3", roughness: 0.85 });

type Props = {
  disc: Disc;
  /** how far the disc is pulled out of the sleeve, in meters (see SLIDE) */
  slide?: number;
} & ThreeElements["group"];

/**
 * Placeholder album sleeve: a card jacket with the cover on the front and the CD inside.
 * Part names match the Blender sleeve (Sleeve, Cover, Disc) so the GLB can replace it later.
 */
export function Sleeve({ disc, slide = SLIDE.rest, ...props }: Props) {
  const texture = getCoverTexture(disc);
  const discRef = useRef<THREE.Group>(null);
  const materials = useMemo(() => {
    const cover = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.6 });
    // BoxGeometry faces: +x, -x, +y, -y, +z (front), -z (back)
    return [cardMaterial, cardMaterial, cardMaterial, cardMaterial, cover, cardMaterial];
  }, [texture]);

  useFrame((_, dt) => {
    const d = discRef.current;
    if (d) d.position.y = THREE.MathUtils.damp(d.position.y, slide, 7, dt);
  });

  return (
    <group name="AlbumSleeve" {...props}>
      <group ref={discRef} name="Disc">
        {/* stand the CD up so its label faces the front of the sleeve */}
        <CD texture={texture} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.0006]} />
      </group>
      <mesh name="Sleeve" material={materials} castShadow receiveShadow>
        <boxGeometry args={[SLEEVE_SIZE, SLEEVE_SIZE, DEPTH]} />
      </mesh>
    </group>
  );
}
