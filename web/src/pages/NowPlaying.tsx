import { useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import * as THREE from "three";
import { Stage } from "../three/Stage";
import { PlayerModel, type PlayerKey } from "../three/PlayerModel";
import { Sleeve } from "../three/Sleeve";
import { SectionHeader } from "../components/SectionHeader";
import { TrackDial } from "../components/TrackDial";
import { actions, useStore } from "../state/store";

const CAMERA: [number, number, number] = [0, 0.5, 0.045];
const TARGET: [number, number, number] = [0, 0, -0.012];
/** where the open sleeve lies, bottom left of the player */
const SLEEVE_AT = new THREE.Vector3(-0.155, -0.004, 0.072);

/** Plays disc.previewUrl when there is one. Until a music API is connected the discs have none, so this stays silent. */
function usePreview(url: string | undefined, playing: boolean) {
  const audio = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    if (!url) return;
    const a = new Audio(url);
    a.addEventListener("ended", () => actions.next());
    audio.current = a;
    return () => {
      a.pause();
      audio.current = null;
    };
  }, [url]);
  useEffect(() => {
    const a = audio.current;
    if (!a) return;
    if (playing) a.play().catch(() => actions.setPlaying(false));
    else a.pause();
  }, [playing, url]);
}

export function NowPlaying() {
  const navigate = useNavigate();
  const location = useLocation();
  const discs = useStore((s) => s.discs);
  const current = useStore((s) => s.current);
  const playing = useStore((s) => s.playing);
  const disc = discs[current];

  // coming from the crate, the disc flies out of its sleeve into the player
  const introFrom = useMemo(
    () => ((location.state as { fromCrate?: boolean } | null)?.fromCrate ? SLEEVE_AT.clone().setY(0.01) : null),
    [location.state],
  );
  useEffect(() => {
    if (introFrom) actions.setPlaying(false);
  }, [introFrom]);

  usePreview(disc.previewUrl, playing);

  const onKey = (key: PlayerKey) => {
    if (key === "prev") actions.prev();
    else if (key === "next") actions.next();
    else actions.togglePlay();
  };

  return (
    <>
      <SectionHeader title="NOW_PLAYING" />
      <Stage position={CAMERA} target={TARGET}>
        <PlayerModel disc={disc} playing={playing} introFrom={introFrom} onIntroDone={() => actions.setPlaying(true)} onKey={onKey} />
        <Sleeve
          disc={disc}
          position={SLEEVE_AT}
          rotation={[-Math.PI / 2, 0, 0.08]}
          scale={0.62}
          onClick={(e) => {
            e.stopPropagation();
            navigate("/crate");
          }}
          onPointerOver={() => (document.body.style.cursor = "pointer")}
          onPointerOut={() => (document.body.style.cursor = "")}
        />
      </Stage>
      <div className="overlay now__dial">
        <TrackDial items={discs} value={current} onChange={actions.select} />
      </div>
    </>
  );
}
