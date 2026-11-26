import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useFrame, type ThreeElements } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import type { Disc } from "../music/types";
import { applyArt, getCoverTexture } from "./coverTexture";

export const SLEEVE_URL = "/models/album_sleeve.glb";
useGLTF.preload(SLEEVE_URL);

export type Pull = "rest" | "peek" | "out";

type Props = {
  disc?: Disc;
  /** how far the disc is pulled out of the top of the sleeve */
  pull?: Pull;
} & ThreeElements["group"];

/**
 * The Blender album sleeve (album_sleeve.glb) with this disc's cover on the front and on the CD label.
 * The disc slides out along +Y by the distances stored in the GLB (peek_distance, out_distance).
 */
export function Sleeve({ disc, pull = "rest", ...props }: Props) {
  const { scene } = useGLTF(SLEEVE_URL);
  const art = getCoverTexture(disc?.coverUrl);

  const model = useMemo(() => {
    const root = scene.clone(true);
    const cd = root.getObjectByName("Disc")!;
    const materials = [applyArt(root.getObjectByName("Cover"), art), applyArt(root.getObjectByName("Disc_Label"), art)];
    return { root, cd, materials };
  }, [scene, art]);

  useEffect(() => () => model.materials.forEach((m) => m?.dispose()), [model]);

  const target = pull === "out" ? (model.cd.userData.out_distance ?? 0.13) : pull === "peek" ? (model.cd.userData.peek_distance ?? 0.05) : 0;
  useFrame((_, dt) => {
    model.cd.position.y = THREE.MathUtils.damp(model.cd.position.y, target, 7, dt);
  });

  return (
    <group {...props}>
      <primitive object={model.root} />
    </group>
  );
}

/** Just the CD from the sleeve GLB, lying flat with the label up, for the player's spindle. */
export function CDModel({ disc, ...props }: { disc?: Disc } & ThreeElements["group"]) {
  const { scene } = useGLTF(SLEEVE_URL);
  const art = getCoverTexture(disc?.coverUrl);
  const model = useMemo(() => {
    const cd = scene.getObjectByName("Disc")!.clone(true);
    cd.position.set(0, 0, 0);
    const material = applyArt(cd.getObjectByName("Disc_Label"), art);
    return { cd, material };
  }, [scene, art]);
  useEffect(() => () => model.material?.dispose(), [model]);

  return (
    <group {...props}>
      <primitive object={model.cd} rotation={[-Math.PI / 2, 0, 0]} />
    </group>
  );
}
