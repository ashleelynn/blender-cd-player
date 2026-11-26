import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Stage } from "../three/Stage";
import { PlayerModel } from "../three/PlayerModel";
import { useStore } from "../state/store";

const CAMERA: [number, number, number] = [0, 0.5, 0.045];
const TARGET: [number, number, number] = [0, 0, -0.012];

/** The player leans a little toward the pointer. */
function FloatingPlayer({ onOpen }: { onOpen: () => void }) {
  const disc = useStore((s) => s.discs[s.current]);
  const ref = useRef<THREE.Group>(null);
  useFrame(({ pointer }, dt) => {
    const g = ref.current;
    if (!g) return;
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, pointer.y * -0.12, 4, dt);
    g.rotation.z = THREE.MathUtils.damp(g.rotation.z, pointer.x * -0.1, 4, dt);
  });
  return (
    <group
      ref={ref}
      onClick={onOpen}
      onPointerOver={() => (document.body.style.cursor = "pointer")}
      onPointerOut={() => (document.body.style.cursor = "")}
    >
      <PlayerModel disc={disc} playing={false} interactive={false} />
    </group>
  );
}

export function Hero() {
  const navigate = useNavigate();
  return (
    <Stage position={CAMERA} target={TARGET}>
      <FloatingPlayer onOpen={() => navigate("/crate")} />
    </Stage>
  );
}
