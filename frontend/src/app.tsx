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
          {/* 
            Here we render Sidebar & Topbar. 
            We also wrap Routes in a layout container 
            so that the content is displayed next to/under them. 
          */}
          <Box display="flex" minHeight="100vh">
            {/* <Sidebar /> <-- Temporarily hidden */}
            <Box display="flex" flexDirection="column" flexGrow={1}>
              <Topbar />
              {/* The rest of your routes */}
              <Routes />
            </Box>
          </Box>
        </BrowserRouter>
      </SearchProvider>
    </ThemeProvider>
  );
}