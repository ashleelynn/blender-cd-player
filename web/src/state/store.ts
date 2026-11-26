import { useSyncExternalStore } from "react";
import { DISCS, type Disc } from "../data/discs";

type State = {
  discs: Disc[];
  /** index of the disc in the player */
  current: number;
  playing: boolean;
};

let state: State = { discs: DISCS, current: 2, playing: false };
const listeners = new Set<() => void>();

function set(patch: Partial<State>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useStore<T>(select: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => select(state));
}

const clamp = (i: number) => Math.min(state.discs.length - 1, Math.max(0, i));

export const actions = {
  select: (i: number) => set({ current: clamp(i) }),
  next: () => set({ current: clamp(state.current + 1) }),
  prev: () => set({ current: clamp(state.current - 1) }),
  togglePlay: () => set({ playing: !state.playing }),
  setPlaying: (playing: boolean) => set({ playing }),
};
