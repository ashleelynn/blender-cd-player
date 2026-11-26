import { useMemo } from "react";
import * as THREE from "three";
import type { ThreeElements } from "@react-three/fiber";

/** Real CD size in meters: 120 mm across, 15 mm hole, 1.2 mm thick. */
export const CD_RADIUS = 0.06;
const HOLE = 0.0075;
const THICK = 0.0012;
const LABEL_IN = 0.0175;
const LABEL_OUT = 0.0575;

const discGeometry = (() => {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, CD_RADIUS, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, HOLE, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(shape, { depth: THICK, bevelEnabled: false, curveSegments: 96 });
  g.rotateX(-Math.PI / 2); // lie flat, top face at +Y
  return g;
})();

const labelGeometry = (() => {
  const g = new THREE.RingGeometry(LABEL_IN, LABEL_OUT, 96);
  g.rotateX(-Math.PI / 2);
  return g;
})();

const discMaterial = new THREE.MeshPhysicalMaterial({
  color: "#dfe3ea",
  metalness: 1,
  roughness: 0.16,
  iridescence: 1,
  iridescenceIOR: 1.7,
  iridescenceThicknessMinimum: 180,
  iridescenceThicknessMaximum: 820,
  clearcoat: 1,
  clearcoatRoughness: 0.05,
});

type Props = { texture: THREE.Texture } & ThreeElements["group"];

/**
 * Placeholder CD: an iridescent disc with the cover art printed on the label.
 * Lies flat with the label facing +Y. Replace with the Blender disc when it has UVs.
 */
export function CD({ texture, ...props }: Props) {
  const labelMaterial = useMemo(() => new THREE.MeshStandardMaterial({ map: texture, roughness: 0.5, metalness: 0.05 }), [texture]);
  return (
    <group {...props}>
      <mesh geometry={discGeometry} material={discMaterial} castShadow />
      <mesh geometry={labelGeometry} material={labelMaterial} position={[0, THICK + 0.00005, 0]} />
    </group>
  );
}
