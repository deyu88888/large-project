import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AllEventsPage from "../AllEventsPage";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { apiClient } from "../../../api";

vi.mock("../../../api", () => ({
  apiClient: {
    get: vi.fn()
  }
}));

vi.mock("../../stores/auth-store", () => ({
  useAuthStore: vi.fn(() => ({
    user: null,
    setUser: vi.fn()
  }))
}));

vi.mock("../../components/EventCard", () => ({
  __esModule: true,
  default: ({ event }) => (
    <div data-testid="event-card">{event.title}</div>
  )
}));

vi.mock("../../theme/theme", () => ({
  tokens: () => ({
    grey: { 100: "#ccc", 200: "#bbb", 300: "#aaa" },
    redAccent: { 400: "red", 300: "lightred" },
    primary: { 400: "#444", 700: "#222" }
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

describe("AllEventsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading spinner initially", async () => {
    apiClient.get.mockImplementation((url) => {
      if (url.includes('user')) {
        return Promise.resolve({ data: [] });
      } else {
        return Promise.resolve({ data: [] });
      }
    });

    renderWithProviders(<AllEventsPage />);
    expect(screen.getByText(/loading events/i)).toBeInTheDocument();
  });

  it("renders event cards on success", async () => {
    apiClient.get.mockImplementation((url) => {
      if (url.includes('user')) {
        return Promise.resolve({ data: { id: 1, following: [2] } });
      } else {
        return Promise.resolve({
          data: [{ id: 10, title: "Test Event", current_attendees: [{ id: 2 }] }]
        });
      }
    });

    renderWithProviders(<AllEventsPage />);

    await waitFor(() => {
      expect(screen.getByText("Test Event")).toBeInTheDocument();
    });
  });

  it("renders empty state when no events", async () => {
    apiClient.get.mockImplementation((url) => {
      if (url.includes('user')) {
        return Promise.resolve({ data: { id: 1, following: [] } });
      } else {
        return Promise.resolve({ data: [] });
      }
    });

    renderWithProviders(<AllEventsPage />);

    await waitFor(() =>
      expect(screen.getByText(/no events available/i)).toBeInTheDocument()
    );
  });

  it("shows error if event fetch fails", async () => {
    apiClient.get.mockImplementation((url) => {
      if (url.includes('user')) {
        return Promise.resolve({ data: { id: 1, following: [] } });
      } else {
        return Promise.reject(new Error("Server down"));
      }
    });

    renderWithProviders(<AllEventsPage />);

    await waitFor(() =>
      expect(
        screen.getByText(/failed to load events/i)
      ).toBeInTheDocument()
    );
  });

  it("gracefully handles unauthenticated user (401)", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    
    apiClient.get.mockImplementation((url) => {
      if (url.includes('user')) {
        return Promise.reject({ response: { status: 401 } });
      } else {
        return Promise.resolve({ data: [] });
      }
    });

    renderWithProviders(<AllEventsPage />);
    await waitFor(() => {
      expect(screen.getByText(/loading events/i)).toBeInTheDocument();
    });

    logSpy.mockRestore();
  });
});