import "./theme/globals.css";
import { App } from "./app.tsx";
import { createRoot } from "react-dom/client";

// Create and render the application
createRoot(document.getElementById("root")!).render(
  <App />
);