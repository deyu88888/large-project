import axios from "axios";
import { Routes } from "./routes";
import { themeSettings } from "./theme/theme";
import { useSettingsStore } from "./stores/settings-store";
import { AuthProvider } from "./components/auth/AuthProvider";
import { QueryClient, QueryClientProvider } from "react-query";
import { SearchProvider } from "./components/layout/SearchContext";
import { ThemeProvider, CssBaseline, createTheme } from "@mui/material";

export const apiClient = axios.create({
  baseURL: "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

export function App() {
  const { themeMode } = useSettingsStore();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider theme={createTheme(themeSettings(themeMode))}>
          <CssBaseline />
          <SearchProvider>
            <Routes />
          </SearchProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
