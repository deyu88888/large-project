import { BrowserRouter } from "react-router-dom";
import { ThemeProvider, CssBaseline, Box } from "@mui/material";
import { ColorModeContext, useMode } from "./styles/theme";
import { Routes } from "./routes";
import axios from "axios";
import { ThemeProvider, CssBaseline, Box } from "@mui/material";
import { ColorModeContext, useMode } from "./theme/theme";
import Sidebar from "./components/layout/AdminSidebar";
import Topbar from "./components/layout/Topbar";

export const apiClient = axios.create({
  baseURL: "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

export function App() {
  const [theme, colorMode] = useMode();

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Routes />
          <Box display="flex">
            <Sidebar /> {/* Sidebar on the left */}
            <Box flexGrow={1} display="flex" flexDirection="column">
              <Topbar /> {/* Topbar at the top */}
              <Box p={2}>
                <Routes />
              </Box>
            </Box>
          </Box>
        </BrowserRouter>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}
