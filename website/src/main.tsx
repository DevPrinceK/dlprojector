import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MarketingSite } from "./MarketingSite";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MarketingSite />
  </StrictMode>
);
