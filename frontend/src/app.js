import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider, CssBaseline, createTheme } from "@mui/material";
import { Routes } from "./routes";
import axios from "axios";
import { useSettingsStore } from "./stores/settings-store";
import { themeSettings } from "./theme/theme";
import { SearchProvider } from "./components/layout/SearchContext";
import { WebSocketProvider } from "./hooks/useWebSocketManager";
import { useRef } from "react";
// Create a persistent WebSocket connection manager
export const PersistentWebSocket = () => {
    // Use useRef to maintain instance between renders
    const initialized = useRef(false);
    // Only render the WebSocketProvider once
    if (!initialized.current) {
        initialized.current = true;
        return _jsx(WebSocketProvider, {});
    }
    // On subsequent renders, just render children
    return null;
};
export const apiClient = axios.create({
    baseURL: "http://localhost:8000",
    headers: {
        "Content-Type": "application/json",
    },
});
export function App() {
    const { themeMode } = useSettingsStore();
    return (_jsxs(ThemeProvider, { theme: createTheme(themeSettings(themeMode)), children: [_jsx(CssBaseline, {}), _jsx(WebSocketProvider, { children: _jsx(SearchProvider, { children: _jsx(BrowserRouter, { children: _jsx(Routes, {}) }) }) })] }));
}
