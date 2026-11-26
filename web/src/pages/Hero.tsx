import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Stage, TopDownFit } from "../three/Stage";
import { PlayerModel } from "../three/PlayerModel";
import { useStore } from "../state/store";
import { HEADER_BOTTOM, MARGIN } from "../layout";

/** The player leans a little toward the pointer. Click it to open the crate. */
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

/**
 * Hero: one focal point. The player is centered on the page's vertical axis in the space under the
 * top bar, at its optical center, with a full margin of air above and below.
 */
export function Hero() {
  const navigate = useNavigate();
  return (
    <Stage>
      <TopDownFit extent={[0.155, 0.185]} top={HEADER_BOTTOM + MARGIN / 2} bottom={MARGIN} />
      <FloatingPlayer onOpen={() => navigate("/crate")} />
    </Stage>
  );
}
