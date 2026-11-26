import type { Disc } from "../music/types";

/**
 * The starter crate: Y2K-era songs on iTunes. Only ids and names live here; the app looks up
 * fresh artwork and preview links on start (see actions.refresh), so they never go stale.
 */
const songs: Array<[trackId: number, title: string, artist: string, album: string, year: string]> = [
  [697195462, "One More Time", "Daft Punk", "Discovery", "2000"],
  [692624266, "Lady (Hear Me Tonight)", "Modjo", "Modjo (Remastered)", "2000"],
  [726320692, "Can't Get You Out of My Head", "Kylie Minogue", "Fever (Deluxe Edition)", "2001"],
  [338349243, "Sandstorm", "Darude", "Before the Storm, Special Edition", "1999"],
  [251948354, "Toxic", "Britney Spears", "In the Zone", "2003"],
  [281242336, "Porcelain", "Moby", "Play & Play: B Sides", "1999"],
  [1442555475, "Barbie Girl", "Aqua", "Aquarium (Special Edition)", "1997"],
  [257425447, "Blue (Da Ba Dee)", "Eiffel 65", "Blue (Da Ba Dee) - Single", "1998"],
];

export const SEED: Disc[] = songs.map(([trackId, title, artist, album, year]) => ({
  id: `itunes:${trackId}`,
  trackId,
  title,
  artist,
  album,
  year,
}));
