import { BrowserRouter } from "react-router-dom";
import { ThemeProvider, CssBaseline, createTheme } from "@mui/material";
import { Routes } from "./routes";
import axios from "axios";
import { useSettingsStore } from "./stores/settings-store";
import { themeSettings } from "./theme/theme";
import { SearchProvider } from "./components/layout/SearchContext";

export const apiClient = axios.create({
  baseURL: "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

export function App() {
  const { themeMode } = useSettingsStore();

  return (
    <ThemeProvider theme={createTheme(themeSettings(themeMode))}>
      <CssBaseline />
      <SearchProvider>
        <BrowserRouter>
          <Routes />
        </BrowserRouter>
      </SearchProvider>
    </ThemeProvider>
  );
}