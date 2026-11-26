import { Link, useLocation } from "react-router-dom";

/** Logo on the left, _PLAY / _BURN nav. The hero centers the nav, every other page puts it on the right. */
export function TopBar() {
  const { pathname } = useLocation();
  const isHero = pathname === "/";
  const playActive = isHero || pathname.startsWith("/crate") || pathname.startsWith("/play");
  const burnActive = pathname.startsWith("/burn");

  return (
    <header className={`topbar ${isHero ? "topbar--hero" : ""}`}>
      <Link to="/" className="logo" aria-label="UNTZ UNTZ home">
        UNTZ UNTZ
      </Link>
      <nav className="nav t-title-lg" aria-label="Main">
        <Link to="/crate" className={playActive ? "is-active" : ""} aria-current={playActive && !isHero ? "page" : undefined}>
          _PLAY
        </Link>
        <Link to="/burn" className={burnActive ? "is-active" : ""} aria-current={burnActive ? "page" : undefined}>
          _BURN
        </Link>
      </nav>
    </header>
  );
}
