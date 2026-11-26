import { useSyncExternalStore } from "react";
import type { Disc } from "../music/types";
import { lookupSongs } from "../music/itunes";
import { SEED } from "../data/seed";

type State = {
  /** the crate, saved in this browser */
  discs: Disc[];
  /** index of the disc in the player */
  current: number;
  playing: boolean;
};

const STORAGE_KEY = "untz.crate.v1";

function loadCrate(): Disc[] {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as Disc[] | null;
    if (Array.isArray(saved)) return saved;
  } catch {
    // ignore a broken save and start from the starter crate
  }
  return SEED;
}

let state: State = { discs: loadCrate(), current: 0, playing: false };
const listeners = new Set<() => void>();

function set(patch: Partial<State>) {
  state = { ...state, ...patch };
  if (patch.discs) localStorage.setItem(STORAGE_KEY, JSON.stringify(state.discs));
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

const clamp = (i: number) => Math.min(Math.max(0, state.discs.length - 1), Math.max(0, i));

export const actions = {
  select: (i: number) => set({ current: clamp(i) }),
  next: () => {
    if (state.current >= state.discs.length - 1) set({ playing: false });
    else set({ current: state.current + 1 });
  },
  prev: () => set({ current: clamp(state.current - 1) }),
  togglePlay: () => set({ playing: !state.playing }),
  setPlaying: (playing: boolean) => set({ playing }),

  /** Burn a disc: it goes to the front of the crate. */
  add: (disc: Disc) => {
    if (state.discs.some((d) => d.id === disc.id)) return;
    const wasEmpty = state.discs.length === 0;
    set({ discs: [disc, ...state.discs], current: wasEmpty ? 0 : state.current + 1 });
  },
  remove: (id: string) => {
    const i = state.discs.findIndex((d) => d.id === id);
    if (i < 0) return;
    const discs = state.discs.filter((d) => d.id !== id);
    const current = i < state.current ? state.current - 1 : Math.min(state.current, Math.max(0, discs.length - 1));
    set({ discs, current, playing: i === state.current ? false : state.playing });
  },

  /** Refresh artwork and preview links for everything in the crate. Keeps what we have if offline. */
  refresh: async () => {
    try {
      const fresh = new Map((await lookupSongs(state.discs.map((d) => d.trackId))).map((d) => [d.id, d]));
      set({ discs: state.discs.map((d) => ({ ...d, ...fresh.get(d.id) })) });
    } catch {
      // offline or iTunes is down: the sleeves fall back to the Blender art
    }
  },
};
