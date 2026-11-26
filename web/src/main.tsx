import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "@fontsource/instrument-sans/400.css";
import "@fontsource/instrument-sans/500.css";
import "@fontsource/instrument-sans/700.css";
import "./styles/fonts.css";
import "./styles/tokens.css";
import "./styles/global.css";
import "./styles/pages.css";
import { Layout } from "./components/Layout";
import { Hero } from "./pages/Hero";
import { Crate } from "./pages/Crate";
import { NowPlaying } from "./pages/NowPlaying";
import { Burn } from "./pages/Burn";

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <Hero /> },
      { path: "/crate", element: <Crate /> },
      { path: "/play", element: <NowPlaying /> },
      { path: "/burn", element: <Burn /> },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
