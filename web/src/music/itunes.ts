import type { Disc } from "./types";

/**
 * iTunes Search API: free, no key, and it allows browser requests (CORS), so no server is needed.
 * Docs: https://performance-partners.apple.com/search-api
 * Apple asks for roughly 20 requests a minute at most, so searches are debounced and cached.
 */
const API = "https://itunes.apple.com";

type Track = {
  wrapperType?: string;
  kind?: string;
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName?: string;
  releaseDate?: string;
  trackTimeMillis?: number;
  previewUrl?: string;
  artworkUrl100?: string;
  trackViewUrl?: string;
};

/** Store front to search, from the browser language (en-GB -> GB). Falls back to US. */
const country = (() => {
  const region = navigator.language.split("-")[1]?.toUpperCase();
  return region && /^[A-Z]{2}$/.test(region) ? region : "US";
})();

/** Artwork URLs end in 100x100bb.jpg; any size up to the original can be requested. */
const artwork = (url: string | undefined, px: number) => url?.replace(/\/\d+x\d+bb\.(jpg|png|webp)$/i, `/${px}x${px}bb.jpg`);

export function toDisc(t: Track): Disc {
  return {
    id: `itunes:${t.trackId}`,
    trackId: t.trackId,
    title: t.trackName,
    artist: t.artistName,
    album: t.collectionName,
    year: t.releaseDate?.slice(0, 4),
    durationMs: t.trackTimeMillis,
    coverUrl: artwork(t.artworkUrl100, 600),
    thumbUrl: artwork(t.artworkUrl100, 120),
    previewUrl: t.previewUrl,
    storeUrl: t.trackViewUrl,
  };
}

async function get(path: "search" | "lookup", params: Record<string, string>, signal?: AbortSignal): Promise<Track[]> {
  const res = await fetch(`${API}/${path}?${new URLSearchParams({ ...params, country })}`, { signal });
  if (!res.ok) throw new Error(`iTunes ${path} failed: ${res.status}`);
  const data = (await res.json()) as { results: Track[] };
  return data.results.filter((t) => t.kind === "song");
}

const searches = new Map<string, Disc[]>();

/** Songs matching a free-text term (song, artist or both). Only songs with a preview are returned. */
export async function searchSongs(term: string, signal?: AbortSignal): Promise<Disc[]> {
  const key = term.trim().toLowerCase();
  const hit = searches.get(key);
  if (hit) return hit;
  const tracks = await get("search", { term: key, media: "music", entity: "song", limit: "15" }, signal);
  const discs = tracks.filter((t) => t.previewUrl).map(toDisc);
  searches.set(key, discs);
  return discs;
}

/** Fresh details (artwork, preview URL) for songs we already know by id. One request for up to 200 ids. */
export async function lookupSongs(trackIds: number[]): Promise<Disc[]> {
  if (trackIds.length === 0) return [];
  const tracks = await get("lookup", { id: trackIds.slice(0, 200).join(",") });
  return tracks.map(toDisc);
}
