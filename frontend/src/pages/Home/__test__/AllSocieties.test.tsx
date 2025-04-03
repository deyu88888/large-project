import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import AllSocieties from "../AllSocieties";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { apiClient } from "../../../api";


vi.mock("../../../api", () => ({
  apiClient: {
    get: vi.fn()
  },
  apiPaths: {
    SOCIETY: {
      All: "/api/societies/"
    }
  }
}));

vi.mock("../../../components/SocietyCard", () => ({
  __esModule: true,
  default: ({ society }) => (
    <div data-testid="society-card">{society.name}</div>
  ),
}));

vi.mock("../../../theme/theme", () => ({
  tokens: () => ({
    grey: { 100: "#ccc", 200: "#bbb", 300: "#aaa", 400: "#999", 700: "#555", 800: "#111" },
    redAccent: { 400: "red", 300: "lightred" },
    greenAccent: { 400: "green", 600: "darkgreen" },
    primary: { 400: "#444", 700: "#222" },
  })
}));

const renderWithProviders = (ui) => {
  const theme = createTheme({ palette: { mode: "light" } });
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>{ui}</ThemeProvider>
    </BrowserRouter>
  );
};

describe("AllSocieties", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading spinner initially", async () => {
    (apiClient.get).mockResolvedValueOnce({ data: [] });
    renderWithProviders(<AllSocieties />);
    expect(screen.getByText(/loading societies/i)).toBeInTheDocument();
    await waitFor(() => expect(apiClient.get).toHaveBeenCalled());
  });

  it("renders society cards when fetch succeeds", async () => {
    (apiClient.get).mockResolvedValueOnce({
      data: [
        { id: 1, name: "Chess Club", category: "Games" },
        { id: 2, name: "Drama Society", category: "Arts" },
      ],
    });
    renderWithProviders(<AllSocieties />);
    
    await waitFor(() => {
      expect(screen.getByText("Games")).toBeInTheDocument();
      expect(screen.getByText("Arts")).toBeInTheDocument();
      expect(screen.getAllByTestId("society-card")).toHaveLength(2);
      expect(screen.getByText("Chess Club")).toBeInTheDocument();
      expect(screen.getByText("Drama Society")).toBeInTheDocument();
    });
  });

  it("renders empty state when no societies returned", async () => {
    (apiClient.get).mockResolvedValueOnce({ data: [] });
    renderWithProviders(<AllSocieties />);
    await waitFor(() => {
      expect(screen.getByText(/no societies available/i)).toBeInTheDocument();
    });
  });

  it("shows error when fetch fails", async () => {
    (apiClient.get).mockRejectedValueOnce(new Error("Server error"));
    renderWithProviders(<AllSocieties />);
    await waitFor(() => {
      expect(screen.getByText(/failed to load societies/i)).toBeInTheDocument();
    });
  });

  it("toggles view modes when toggle button is clicked", async () => {
    (apiClient.get).mockResolvedValueOnce({
      data: [
        { id: 1, name: "Chess Club", category: "Games" },
        { id: 2, name: "Drama Society", category: "Arts" },
      ],
    });
    renderWithProviders(<AllSocieties />);
    
    await waitFor(() => {
      expect(screen.getByText("Group by Category")).toBeInTheDocument();
    });
    
    expect(screen.getByText("Games")).toBeInTheDocument();
    expect(screen.getByText("Arts")).toBeInTheDocument();
    
    fireEvent.click(screen.getByText("View All"));
    
    expect(screen.queryByText("Games")).not.toBeInTheDocument();
    expect(screen.queryByText("Arts")).not.toBeInTheDocument();
    expect(screen.getAllByTestId("society-card")).toHaveLength(2);
  });
});