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
    grey: { 100: "#ccc", 200: "#bbb", 300: "#aaa", 400: "#999" },
    redAccent: { 400: "red", 300: "lightred" },
    primary: { 100: "#eee", 400: "#444", 700: "#222", 900: "#111" },
    greenAccent: { 400: "green", 700: "darkgreen" }
  })
}));

vi.mock("../../../hooks/useAuthCheck", () => ({
  default: vi.fn(() => ({
    isAuthenticated: false,
    isLoading: false
  }))
}));

vi.mock("../../../utils/mapper", () => ({
  mapToEventData: (data) => ({
    eventId: data.id,
    title: data.title,
    currentAttendees: data.current_attendees
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
    
    await waitFor(() => {
      expect(screen.getByText(/loading events/i)).toBeInTheDocument();
    });
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
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    
    (apiClient.get as any)
      .mockRejectedValueOnce({ response: { status: 401 } }) // user
      .mockResolvedValueOnce({ data: [] }); // events

    renderWithProviders(<AllEventsPage />);
    
    await waitFor(() => {
      expect(screen.queryByText(/failed to load events/i)).not.toBeInTheDocument();
    });

    expect(errorSpy).not.toHaveBeenCalled();
    
    errorSpy.mockRestore();
    logSpy.mockRestore();
  });
});