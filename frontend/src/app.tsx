import { BrowserRouter } from "react-router-dom";
import { ThemeProvider, CssBaseline, Box } from "@mui/material";
import { ColorModeContext, useMode } from "./styles/theme";
import { Routes } from "./routes";
import axios from "axios";
import Sidebar from "./components/layout/Sidebar";
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
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}
