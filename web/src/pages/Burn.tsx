import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { SectionHeader } from "../components/SectionHeader";
import { IconButton } from "../components/IconButton";
import { CheckIcon, PlusIcon, SearchIcon } from "../components/Icons";
import { Stage } from "../three/Stage";
import { Sleeve } from "../three/Sleeve";
import { searchSongs } from "../music/itunes";
import type { Disc } from "../music/types";
import { actions, useStore } from "../state/store";

type Status = "idle" | "loading" | "done" | "error";

/** The selected song's sleeve, turning slowly with its disc peeking out. */
function TurningSleeve({ disc }: { disc: Disc }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = -0.22 + Math.sin(clock.elapsedTime * 0.6) * 0.18;
  });
  return (
    <group ref={ref}>
      <Sleeve disc={disc} pull="peek" />
    </group>
  );
}

const meta = (d: Disc) => [d.artist, d.album].filter(Boolean).join(" — ") + (d.year ? ` (${d.year})` : "");

/** Search iTunes and burn songs into the crate. */
export function Burn() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Disc[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const crateKey = useStore((s) => s.discs.map((d) => d.id).join("|"));
  const inCrate = useMemo(() => new Set(crateKey.split("|")), [crateKey]);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      setStatus("idle");
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setStatus("loading");
      searchSongs(term, controller.signal)
        .then((found) => {
          setResults(found);
          setSelectedId(found[0]?.id ?? null);
          setStatus("done");
        })
        .catch((err: unknown) => {
          if ((err as Error).name !== "AbortError") setStatus("error");
        });
    }, 350); // debounce: iTunes allows about 20 requests a minute
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const selected = results.find((r) => r.id === selectedId) ?? null;
  const statusText =
    status === "loading"
      ? "Searching iTunes…"
      : status === "error"
        ? "Search is down. Try again in a minute."
        : status === "done" && results.length === 0
          ? "Nothing found. Try the artist and song name."
          : status === "done"
            ? `${results.length} songs · + burns one into your crate`
            : "Type a song or artist";

  return (
    <>
      <SectionHeader title="BURN_A_MIXTAPE" />

      <section className="overlay burn__search" aria-label="Search songs">
        <label className="search-field">
          <SearchIcon />
          <input
            type="search"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="song or artist"
            aria-label="Search songs on iTunes"
            spellCheck={false}
          />
        </label>
        <p className="t-label-sm burn__status" aria-live="polite">
          {statusText}
        </p>
        <ul className="results">
          {results.map((r) => {
            const added = inCrate.has(r.id);
            return (
              <li key={r.id} className={`result ${r.id === selectedId ? "is-selected" : ""}`}>
                <button type="button" className="result__main" onClick={() => setSelectedId(r.id)} aria-pressed={r.id === selectedId}>
                  <img src={r.thumbUrl} alt="" width={56} height={56} loading="lazy" />
                  <span className="result__text">
                    <span className="t-title-md">{r.title}</span>
                    <span className="t-body-sm result__meta">{meta(r)}</span>
                  </span>
                </button>
                <IconButton
                  variant={added ? "primary" : "secondary"}
                  icon={added ? <CheckIcon /> : <PlusIcon />}
                  label={added ? `Take ${r.title} out of the crate` : `Burn ${r.title} into the crate`}
                  onClick={() => (added ? actions.remove(r.id) : actions.add(r))}
                />
              </li>
            );
          })}
        </ul>
      </section>

      {selected && (
        <section className="overlay burn__preview" aria-label="Selected song">
          <div className="burn__stage">
            <Stage position={[0, 0.035, 0.46]} target={[0, 0.035, 0]}>
              <TurningSleeve disc={selected} />
            </Stage>
          </div>
          <div className="burn__info">
            <p className="t-title-lg">{selected.title}</p>
            <p className="t-body-sm result__meta">{meta(selected)}</p>
            {selected.storeUrl && (
              <a className="t-label-sm burn__store" href={selected.storeUrl} target="_blank" rel="noreferrer">
                Listen on Apple Music ↗
              </a>
            )}
          </div>
        </section>
      )}
    </>
  );
}
