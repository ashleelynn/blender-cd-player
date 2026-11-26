import { useRef, type KeyboardEvent } from "react";
import { useScrollStep } from "../hooks/useScrollStep";

type Props = { items: Array<{ title: string }>; value: number; onChange: (index: number) => void };

const ROW = 56;
const HEIGHT = 168;

/**
 * Vertical track dial. Scroll (wheel, trackpad or touch) moves one track per step;
 * the selected track sits in the middle and the ones above and below are blurred.
 * No buttons. Arrow keys work when it has focus, for keyboard users.
 */
export function TrackDial({ items, value, onChange }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const clamp = (i: number) => Math.min(items.length - 1, Math.max(0, i));
  useScrollStep(ref, (dir) => onChange(clamp(value + dir)));

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown") onChange(clamp(value + 1));
    else if (e.key === "ArrowUp") onChange(clamp(value - 1));
    else return;
    e.preventDefault();
  };

  return (
    <div
      ref={ref}
      className="dial"
      tabIndex={0}
      role="listbox"
      aria-label="Tracks. Scroll to change."
      aria-activedescendant={`dial-${value}`}
      onKeyDown={onKeyDown}
    >
      <div className="dial__track" style={{ transform: `translateY(${(HEIGHT - ROW) / 2 - value * ROW}px)` }}>
        {items.map((item, i) => {
          const d = Math.abs(i - value);
          const state = d === 0 ? "is-selected" : d === 1 ? "is-adjacent" : "is-hidden";
          return (
            <div key={i} id={`dial-${i}`} role="option" aria-selected={d === 0} className={`dial__row ${state}`}>
              <span className="dial__no">{String(i + 1).padStart(2, "0")}</span>
              <span className="dial__title">{item.title}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
