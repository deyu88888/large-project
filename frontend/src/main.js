import { jsx as _jsx } from "react/jsx-runtime";
import "./theme/globals.css";
import { App } from "./app.tsx";
import { createRoot } from "react-dom/client";
// StrictMode has been removed to prevent double mounting of components
// This is necessary to fix WebSocket connection stability issues
// StrictMode causes components to mount twice in development, which
// leads to WebSocket connections being created and destroyed rapidly
createRoot(document.getElementById("root")).render(_jsx(App, {}));
