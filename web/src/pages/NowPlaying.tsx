import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { Stage, TopDownFit } from "../three/Stage";
import { DISC_SEAT, PlayerModel, type PlayerKey } from "../three/PlayerModel";
import { Sleeve } from "../three/Sleeve";
import { SectionHeader } from "../components/SectionHeader";
import { TrackDial } from "../components/TrackDial";
import { actions, useStore } from "../state/store";
import { MARGIN, TITLE_BOTTOM } from "../layout";

/** where the open sleeve lies, bottom left of the player */
const SLEEVE_AT = new THREE.Vector3(-0.155, -0.004, 0.072);

/** Reports where a 3D point lands on screen, so DOM pieces can line up with it. */
function ScreenAnchor({ point, onChange }: { point: THREE.Vector3; onChange: (y: number) => void }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  useLayoutEffect(() => {
    camera.updateMatrixWorld();
    const p = point.clone().project(camera);
    onChange(((1 - p.y) / 2) * size.height);
  }, [camera, size, point, onChange]);
  return null;
}

/** Plays the disc's 30 second iTunes preview while `playing`, and moves on when it ends. */
function usePreview(url: string | undefined, playing: boolean) {
  const audio = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    if (!url) return;
    const a = new Audio(url);
    a.addEventListener("ended", () => actions.next());
    audio.current = a;
    return () => {
      a.pause();
      a.src = "";
      audio.current = null;
    };
  }, [url]);
  useEffect(() => {
    const a = audio.current;
    if (!a) return;
    if (playing) a.play().catch(() => actions.setPlaying(false)); // autoplay can be blocked until a click
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
  const [discY, setDiscY] = useState<number | null>(null);
  const onAnchor = useCallback((y: number) => setDiscY(y), []);

  // coming from the crate, the disc flies out of its sleeve into the player
  const introFrom = useMemo(
    () => ((location.state as { fromCrate?: boolean } | null)?.fromCrate ? SLEEVE_AT.clone().setY(0.01) : null),
    [location.state],
  );
  useEffect(() => {
    if (introFrom) actions.setPlaying(false);
  }, [introFrom]);

  usePreview(disc?.previewUrl, playing);

  const onKey = (key: PlayerKey) => {
    if (key === "prev") actions.prev();
    else if (key === "next") actions.next();
    else actions.togglePlay();
  };

  return (
    <>
      <SectionHeader title="NOW_PLAYING" />
      <Stage>
        <TopDownFit extent={[0.155, 0.185]} top={TITLE_BOTTOM + MARGIN / 2} bottom={MARGIN} />
        <ScreenAnchor point={DISC_SEAT} onChange={onAnchor} />
        <PlayerModel disc={disc} playing={playing} introFrom={introFrom} onIntroDone={() => actions.setPlaying(true)} onKey={onKey} />
        {disc && (
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
        )}
      </Stage>

      {disc ? (
        <>
          <div className="overlay now__dial" style={discY === null ? undefined : { top: discY }}>
            <TrackDial items={discs} value={current} onChange={actions.select} />
          </div>
          {disc.storeUrl && (
            <a className="overlay now__store t-label-sm" href={disc.storeUrl} target="_blank" rel="noreferrer">
              Listen on Apple Music ↗
            </a>
          )}
        </>
      ) : (
        <div className="overlay now__empty" role="status">
          <Link to="/burn" className="t-label-md empty__link">
            The crate is empty. Burn a disc →
          </Link>
        </div>
      )}
    </>
  );
}
