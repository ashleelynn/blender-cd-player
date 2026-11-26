import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Stage } from "../three/Stage";
import { Sleeve, type Pull } from "../three/Sleeve";
import { SectionHeader } from "../components/SectionHeader";
import { IconButton } from "../components/IconButton";
import { SearchIcon, ShuffleIcon } from "../components/Icons";
import { useScrollStep } from "../hooks/useScrollStep";
import { actions, useStore } from "../state/store";
import type { Disc } from "../music/types";

const CAMERA: [number, number, number] = [0, 0.03, 0.9];
const TARGET: [number, number, number] = [0, 0.03, 0];
const GAP = 0.16; // sleeve spacing in meters

type RowProps = {
  discs: Disc[];
  focus: number;
  pulled: number | null;
  onPick: (i: number) => void;
};

/** The crate: sleeves in a row, the focused one centered and facing you, the rest turned slightly away. */
function CrateRow({ discs, focus, pulled, onPick }: RowProps) {
  const refs = useRef<Array<THREE.Group | null>>([]);
  const placed = useRef(new WeakSet<THREE.Group>());
  const [hover, setHover] = useState<number | null>(null);

  // start each sleeve at its slot instead of sliding out from the middle on first paint
  const attach = (i: number) => (g: THREE.Group | null) => {
    refs.current[i] = g;
    if (g && !placed.current.has(g)) {
      placed.current.add(g);
      g.position.x = (i - focus) * GAP;
      g.rotation.y = THREE.MathUtils.clamp(-(i - focus) * 0.22, -0.5, 0.5);
    }
  };

  useFrame((_, dt) => {
    refs.current.forEach((g, i) => {
      if (!g) return;
      const d = i - focus;
      g.position.x = THREE.MathUtils.damp(g.position.x, d * GAP, 6, dt);
      g.position.z = THREE.MathUtils.damp(g.position.z, d === 0 ? 0.03 : -Math.min(Math.abs(d), 3) * 0.012, 6, dt);
      g.rotation.y = THREE.MathUtils.damp(g.rotation.y, THREE.MathUtils.clamp(-d * 0.22, -0.5, 0.5), 6, dt);
    });
  });

  return (
    <>
      {discs.map((disc, i) => {
        const pull: Pull = pulled === i ? "out" : hover === i || (i === focus && pulled === null) ? "peek" : "rest";
        return (
          <group key={disc.id} ref={attach(i)}>
            <Sleeve
              disc={disc}
              pull={pull}
              onClick={(e) => {
                e.stopPropagation();
                onPick(i);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHover(i);
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => {
                setHover((h) => (h === i ? null : h));
                document.body.style.cursor = "";
              }}
            />
          </group>
        );
      })}
    </>
  );
}

export function Crate() {
  const navigate = useNavigate();
  const discs = useStore((s) => s.discs);
  const current = useStore((s) => s.current);
  const [focus, setFocus] = useState(current);
  const [pulled, setPulled] = useState<number | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const clamp = (i: number) => Math.min(discs.length - 1, Math.max(0, i));

  useScrollStep(pageRef, (dir) => pulled === null && setFocus((f) => clamp(f + dir)), { axis: "x" });

  const pick = (i: number) => {
    if (pulled !== null) return;
    if (i !== focus) return setFocus(i);
    setPulled(i);
    window.setTimeout(() => {
      actions.select(i);
      navigate("/play", { state: { fromCrate: true } });
    }, 650);
  };

  const disc = discs[Math.min(focus, discs.length - 1)];
  const count = (n: number) => String(n).padStart(2, "0");

  if (!disc) {
    return (
      <div ref={pageRef} className="crate">
        <SectionHeader title="THE_CRATE" />
        <div className="overlay empty" role="status">
          <p className="t-display-lg">CRATE IS EMPTY</p>
          <Link to="/burn" className="t-label-md empty__link">
            Burn your first disc →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div ref={pageRef} className="crate">
      <SectionHeader title="THE_CRATE" hint="Scroll to flip through · click a case to pull the disc" />
      <Stage position={CAMERA} target={TARGET}>
        <CrateRow discs={discs} focus={focus} pulled={pulled} onPick={pick} />
      </Stage>

      <div className="overlay crate__caption" aria-live="polite">
        <span className="t-label-sm crate__count">
          {count(focus + 1)} / {count(discs.length)}
        </span>
        <span className="t-title-lg">{disc.title}</span>
        <span className="t-body-md crate__artist">{disc.artist}</span>
        <IconButton
          variant="primary"
          label="Random spin"
          icon={<ShuffleIcon />}
          className="crate__shuffle"
          onClick={() => setFocus(Math.floor(Math.random() * discs.length))}
        />
      </div>

      <div className="overlay crate__footer">
        <div className="crate__progress" aria-hidden>
          <span style={{ left: `${(focus / Math.max(1, discs.length - 1)) * 85}%` }} />
        </div>
        <div className="crate__search">
          <span className="t-label-sm">Can&apos;t find your favorite?</span>
          <IconButton label="Search for a song" icon={<SearchIcon />} onClick={() => navigate("/burn")} />
        </div>
      </div>
    </div>
  );
}
