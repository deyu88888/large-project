import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { App } from "../../app";
import * as settingsStoreModule from "../../stores/settings-store";
import { SearchProvider } from "../../components/layout/SearchContext";
import { ThemeProvider, createTheme } from "@mui/material";
import { BrowserRouter } from "react-router-dom";
import { themeSettings } from "../../theme/theme";
import { Routes } from "../../routes";

// Mock other modules/routes as you did before
vi.mock("../../routes", () => ({
  Routes: () => <div data-testid="routes">Routes Component</div>,
}));

vi.mock("../../components/layout/SearchContext", () => ({
  SearchProvider: ({ children }) => <div data-testid="search-provider">{children}</div>,
}));

vi.mock("react-router-dom", () => ({
  BrowserRouter: ({ children }) => (
    <div data-testid="browser-router">{children}</div>
  ),
}));

// 1) Mock themeSettings as a spy (vi.fn) so we can track calls
vi.mock("../../theme/theme", () => ({
  themeSettings: vi.fn((mode: string) => ({
    palette: {
      mode,
    },
  })),
}));

// 2) Mock @mui/material so createTheme & ThemeProvider are also spies
vi.mock("@mui/material", async () => {
  const original = (await vi.importActual<any>("@mui/material")) || {};
  return {
    ...original,
    CssBaseline: vi.fn(() => <div data-testid="css-baseline">CssBaseline Component</div>),
    createTheme: vi.fn((settings) => ({
      ...settings,
      palette: { mode: settings.palette.mode },
    })),
    ThemeProvider: vi.fn(({ children, theme }) => (
      <div data-testid="theme-provider" data-theme-mode={theme.palette.mode}>
        {children}
      </div>
    )),
  };
});

describe("App Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Spy on useSettingsStore and return "light" by default
    vi.spyOn(settingsStoreModule, "useSettingsStore").mockReturnValue({ themeMode: "light" });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders without crashing", () => {
    render(<App />);
    expect(screen.getByTestId("theme-provider")).toBeDefined();
    expect(screen.getByTestId("search-provider")).toBeDefined();
    expect(screen.getByTestId("browser-router")).toBeDefined();
    expect(screen.getByTestId("routes")).toBeDefined();
  });

  it("uses light theme when themeMode is 'light'", () => {
    // Force light mode for this test
    vi.mocked(settingsStoreModule.useSettingsStore).mockReturnValue({ themeMode: "light" });

    render(<App />);
    expect(screen.getByTestId("theme-provider")).toHaveAttribute("data-theme-mode", "light");

    // Confirm themeSettings() got called with "light"
    expect(vi.mocked(themeSettings)).toHaveBeenCalledWith("light");
    // Confirm createTheme() got called
    expect(vi.mocked(createTheme)).toHaveBeenCalledWith({ palette: { mode: "light" } });
  });

  it("uses dark theme when themeMode is 'dark'", () => {
    vi.mocked(settingsStoreModule.useSettingsStore).mockReturnValue({ themeMode: "dark" });

    render(<App />);
    expect(screen.getByTestId("theme-provider")).toHaveAttribute("data-theme-mode", "dark");
    expect(vi.mocked(themeSettings)).toHaveBeenCalledWith("dark");
    expect(vi.mocked(createTheme)).toHaveBeenCalledWith({ palette: { mode: "dark" } });
  });

  it("properly nests all providers in the correct order", () => {
    render(<App />);
    const themeProvider = screen.getByTestId("theme-provider");
    const searchProvider = screen.getByTestId("search-provider");
    const browserRouter = screen.getByTestId("browser-router");
    const routes = screen.getByTestId("routes");

    expect(themeProvider).toBeDefined();
    expect(themeProvider.contains(searchProvider)).toBe(true);
    expect(searchProvider.contains(browserRouter)).toBe(true);
    expect(browserRouter.contains(routes)).toBe(true);
  });

  it("passes the correct theme settings to ThemeProvider", () => {
    vi.mocked(settingsStoreModule.useSettingsStore).mockReturnValue({ themeMode: "dark" });

    render(<App />);
    // Was themeSettings() called with "dark"?
    expect(vi.mocked(themeSettings)).toHaveBeenCalledWith("dark");
    // Did we create a dark theme?
    expect(vi.mocked(createTheme)).toHaveBeenCalledWith({ palette: { mode: "dark" } });
    // Check if ThemeProvider was called with the dark theme
    expect(vi.mocked(ThemeProvider)).toHaveBeenCalledWith(
      expect.objectContaining({
        theme: expect.objectContaining({
          palette: { mode: "dark" },
        }),
      }),
      expect.anything()
    );
  });

  it("integrates with the settings store correctly", () => {
    render(<App />);
    expect(settingsStoreModule.useSettingsStore).toHaveBeenCalled();
  });
});