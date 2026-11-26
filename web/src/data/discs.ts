/**
 * Placeholder crate. Each disc is one song: the sleeve and the CD label show its cover.
 * When a music API is connected, coverUrl and previewUrl get filled in from it.
 */
export type Disc = {
  id: string;
  no: number;
  title: string;
  artist: string;
  /** seconds */
  duration: number;
  coverUrl?: string;
  previewUrl?: string;
};

const SONGS: Array<Omit<Disc, "no">> = [
  { id: "soft-machines", title: "Soft Machines", artist: "Lumen Hall", duration: 212 },
  { id: "silver-thread", title: "Silver Thread", artist: "Kei & the Static", duration: 187 },
  { id: "glasshouse", title: "Glasshouse", artist: "Mira Vale", duration: 242 },
  { id: "low-light", title: "Low Light", artist: "Lumen Hall", duration: 214 },
  { id: "night-bus-fm", title: "Night Bus FM", artist: "Ohm Kids", duration: 199 },
  { id: "chrome-hearts-club", title: "Chrome Hearts Club", artist: "Y2Kay", duration: 205 },
  { id: "afterimage", title: "Afterimage", artist: "Polyglass", duration: 231 },
  { id: "after-hours-before", title: "After Hours, Before", artist: "Mira Vale", duration: 229 },
];

export const DISCS: Disc[] = SONGS.map((song, i) => ({ ...song, no: i + 1 }));
