import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { ContactShadows, useGLTF } from "@react-three/drei";
import type { Disc } from "../music/types";
import { CDModel } from "./Sleeve";

const MODEL_URL = "/models/cd_player.glb";
useGLTF.preload(MODEL_URL);

/** where the disc sits on the spindle (the GLB's Disc node), for lining things up with it */
export const DISC_SEAT = new THREE.Vector3(0, 0.015, -0.022);

export type PlayerKey = "prev" | "toggle_play" | "next";
/** node name -> the `action` custom property it carries in the GLB */
const KEYS: Record<string, PlayerKey> = { Button_Prev: "prev", Button_PlayStop: "toggle_play", Button_Next: "next" };

const KEY_TRAVEL = 0.0013; // 1.3 mm press
const LID_OPEN = -1.15; // radians around X; negative lifts the lid
const SPIN = Math.PI * 2 * 1.4; // rad/s, slowed down from 500 rpm so it reads on screen

const smooth = (t: number, a: number, b: number) => {
  const x = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
};

type Props = {
  /** the disc on the spindle; none leaves the bay empty */
  disc?: Disc;
  playing: boolean;
  /** pink keys respond to clicks */
  interactive?: boolean;
  /** when set, the lid opens, the disc flies in from this point and seats, then onIntroDone fires */
  introFrom?: THREE.Vector3 | null;
  onIntroDone?: () => void;
  onKey?: (key: PlayerKey) => void;
};

/**
 * The Blender CD player (cd_player.glb). Its own Disc has no UVs for art, so it is hidden and
 * the CD from album_sleeve.glb, with the song's cover on the label, sits on the spindle instead. The play key's icon follows `playing` (glTF has no visibility, so it is set here).
 */
export function PlayerModel({ disc, playing, interactive = true, introFrom = null, onIntroDone, onKey }: Props) {
  const gltf = useGLTF(MODEL_URL);
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);

  const parts = useMemo(() => {
    scene.updateMatrixWorld(true);
    const get = (name: string) => scene.getObjectByName(name) ?? null;
    const glbDisc = get("Disc");
    const seat = new THREE.Vector3();
    glbDisc?.getWorldPosition(seat);
    if (glbDisc) glbDisc.visible = false;
    const keys = Object.keys(KEYS)
      .map(get)
      .filter((o): o is THREE.Object3D => o !== null);
    const floor = new THREE.Box3().setFromObject(scene).min.y;
    return {
      seat,
      floor,
      lid: get("Lid"),
      iconPlay: get("Icon_Play"),
      iconStop: get("Icon_Stop"),
      keys,
      keyRest: new Map(keys.map((k) => [k.name, k.position.y])),
    };
  }, [scene]);

  useEffect(() => {
    if (parts.iconPlay) parts.iconPlay.visible = !playing;
    if (parts.iconStop) parts.iconStop.visible = playing;
  }, [playing, parts]);

  const cdRef = useRef<THREE.Group>(null);
  const pressedAt = useRef(new Map<string, number>());
  const introStart = useRef<number | null>(null);
  const introDone = useRef(onIntroDone);
  useEffect(() => {
    introDone.current = onIntroDone;
  });

  useEffect(() => {
    introStart.current = introFrom ? performance.now() : null;
  }, [introFrom]);

  const keyOf = (o: THREE.Object3D | null) => {
    while (o && !KEYS[o.name]) o = o.parent;
    return o;
  };
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (!interactive) return;
    const key = keyOf(e.object);
    if (!key) return;
    e.stopPropagation();
    pressedAt.current.set(key.name, performance.now());
    onKey?.(KEYS[key.name]);
  };
  const onPointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (interactive) document.body.style.cursor = keyOf(e.object) ? "pointer" : "";
  };
  const onPointerOut = () => {
    document.body.style.cursor = "";
  };

  const arcPos = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, dt) => {
    const now = performance.now();

    for (const key of parts.keys) {
      const t0 = pressedAt.current.get(key.name);
      let depth = 0;
      if (t0 !== undefined) {
        const t = (now - t0) / 1000;
        depth = t < 0.07 ? t / 0.07 : Math.max(0, 1 - (t - 0.07) / 0.14);
        if (t > 0.21) pressedAt.current.delete(key.name);
      }
      key.position.y = (parts.keyRest.get(key.name) ?? 0) - KEY_TRAVEL * depth;
    }

    const cd = cdRef.current;
    if (!cd) return;
    let lid = 0;
    if (introStart.current !== null && introFrom) {
      const t = (now - introStart.current) / 1000;
      lid = LID_OPEN * (smooth(t, 0, 0.5) - smooth(t, 1.5, 2.0));
      const p = smooth(t, 0.35, 1.45);
      arcPos.copy(introFrom).lerp(parts.seat, p);
      arcPos.y += Math.sin(p * Math.PI) * 0.09;
      cd.position.copy(arcPos);
      cd.rotation.z = (1 - p) * 0.5;
      cd.rotation.y += dt * SPIN * 0.3;
      if (t > 2.0) {
        introStart.current = null;
        introDone.current?.();
      }
    } else {
      cd.position.copy(parts.seat);
      cd.rotation.z = 0;
      if (playing) cd.rotation.y -= dt * SPIN;
    }
    if (parts.lid) parts.lid.rotation.x = lid;
  });

  return (
    <group>
      <primitive object={scene} onClick={onClick} onPointerMove={onPointerMove} onPointerOut={onPointerOut} />
      <group ref={cdRef}>{disc && <CDModel disc={disc} />}</group>
      <ContactShadows position={[0, parts.floor - 0.0004, 0]} scale={0.5} blur={2.6} far={0.06} opacity={0.32} resolution={512} />
    </group>
  );
}
