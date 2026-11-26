import { Link, useLocation } from "react-router-dom";

/**
 * The same bar on every page: logo on the left margin, _PLAY / _BURN on the right margin,
 * both centered on one line. The hero highlights _PLAY as the main way in.
 */
export function TopBar() {
  const { pathname } = useLocation();
  const playActive = pathname === "/" || pathname.startsWith("/crate") || pathname.startsWith("/play");
  const burnActive = pathname.startsWith("/burn");

  return (
    <header className="topbar">
      <Link to="/" className="logo" aria-label="UNTZ UNTZ home">
        UNTZ UNTZ
      </Link>
      <nav className="nav t-title-lg" aria-label="Main">
        <Link to="/crate" className={playActive ? "is-active" : ""} aria-current={playActive && pathname !== "/" ? "page" : undefined}>
          _PLAY
        </Link>
        <Link to="/burn" className={burnActive ? "is-active" : ""} aria-current={burnActive ? "page" : undefined}>
          _BURN
        </Link>
      </nav>
    </header>
  );
}
