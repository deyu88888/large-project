import { ThemeProvider, CssBaseline, createTheme } from "@mui/material";
import { SearchProvider } from "./components/layout/SearchContext";
import { WebSocketProvider } from "./hooks/useWebSocketManager";
import { useSettingsStore } from "./stores/settings-store";
import { BrowserRouter } from "react-router-dom";
import { themeSettings } from "./theme/theme";
import { Routes } from "./routes";
import { useRef } from "react";

// Create a persistent WebSocket connection manager
export const PersistentWebSocket = () => {
  // Use useRef to maintain instance between renders
  const initialized = useRef(false);

  // Only render the WebSocketProvider once
  if (!initialized.current) {
    initialized.current = true;
    return <WebSocketProvider children={""} />;
  }
  
  // On subsequent renders, just render children
  return null;
};

export function App() {
  const { themeMode } = useSettingsStore();

  return (
    <ThemeProvider theme={createTheme(themeSettings(themeMode))}>
      <CssBaseline />
      {/* Move WebSocketProvider outside BrowserRouter */}
      <WebSocketProvider>
        <SearchProvider>
          <BrowserRouter>
            <Routes />
          </BrowserRouter>
        </SearchProvider>
      </WebSocketProvider>
    </ThemeProvider>
  );
}