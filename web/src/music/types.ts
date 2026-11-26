/** One song in the crate. Each disc is one song: its sleeve and CD label show the cover art. */
export type Disc = {
  /** "itunes:<trackId>" */
  id: string;
  trackId: number;
  title: string;
  artist: string;
  album?: string;
  year?: string;
  durationMs?: number;
  /** 600 px cover, used on the 3D sleeve and CD label */
  coverUrl?: string;
  /** 120 px cover, used in lists */
  thumbUrl?: string;
  /** 30 second AAC preview */
  previewUrl?: string;
  /** the song's Apple Music / iTunes page */
  storeUrl?: string;
};
