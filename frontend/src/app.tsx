import { ThemeProvider, CssBaseline, createTheme } from "@mui/material";
import { SearchProvider } from "./components/layout/SearchContext";
import { useSettingsStore } from "./stores/settings-store";
import { BrowserRouter } from "react-router-dom";
import { themeSettings } from "./theme/theme";
import { Routes } from "./routes";

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