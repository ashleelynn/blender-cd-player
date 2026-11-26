import { SectionHeader } from "../components/SectionHeader";

/** Search + burn your own disc. Not built yet. */
export function Burn() {
  return (
    <>
      <SectionHeader title="BURN_A_MIXTAPE" />
      <div className="overlay burn__soon" role="status">
        <p className="t-display-lg">
          COMING SOON<span className="burn__cursor">_</span>
        </p>
      </div>
    </>
  );
}
