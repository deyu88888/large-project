import "./theme/globals.css";
import { App } from "./app.tsx";
import { createRoot } from "react-dom/client";

createRoot(document.getElementById("root")!).render(
  <App />
);