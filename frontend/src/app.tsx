import { BrowserRouter } from "react-router-dom";
import { ThemeProvider, CssBaseline, Box } from "@mui/material";
import { ColorModeContext, useMode } from "./styles/theme";
import { Routes } from "./routes";
import axios from "axios";

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
        </BrowserRouter>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}