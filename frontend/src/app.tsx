import { BrowserRouter } from "react-router-dom";
import { ThemeProvider, CssBaseline, Box } from "@mui/material";
import { ColorModeContext, useMode } from "./styles/theme";
import { Routes } from "./routes";
import Sidebar from "./components/layout/Sidebar";
import Topbar from "./components/layout/Topbar";

export function App() {
  const [theme, colorMode] = useMode();

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
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
