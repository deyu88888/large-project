import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material";
import CreateEvent from "../CreateSocietyEvent";
import { apiClient } from "../../../api";

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ societyId: "123" }),
  };
});

vi.mock("../../../components/EventForm", () => ({
  EventForm: vi.fn(({ onSubmit }) => (
    <div data-testid="event-form">
      <button
        data-testid="submit-button"
        onClick={() => onSubmit({ title: "Test Event", description: "Test Description" })}
      >
        Submit
      </button>
    </div>
  )),
}));

vi.mock("../../../api", () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
const mockPostResponse = { status: 201, statusText: "Created" };

const theme = createTheme({
  palette: {
    mode: "light",
  },
});

describe("CreateEvent Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    const styleTag = document.getElementById("event-form-styles");
    if (styleTag) {
      styleTag.remove();
    }
  });

  it("renders EventForm component", () => {
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={["/society/123/create-event"]}>
          <Routes>
            <Route path="/society/:societyId/create-event" element={<CreateEvent />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    );
    expect(screen.getByTestId("event-form")).toBeInTheDocument();
  });

  it("adds style tag to document head", () => {
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={["/society/123/create-event"]}>
          <CreateEvent />
        </MemoryRouter>
      </ThemeProvider>
    );
    const styleTag = document.getElementById("event-form-styles");
    expect(styleTag).toBeInTheDocument();
    expect(styleTag?.innerHTML).toContain("#141b2d !important");
  });

  it("handles successful form submission", async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce(mockPostResponse);
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={["/society/123/create-event"]}>
          <CreateEvent />
        </MemoryRouter>
      </ThemeProvider>
    );
    fireEvent.click(screen.getByTestId("submit-button"));
    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith("/api/events/requests/123/", {
        title: "Test Event",
        description: "Test Description",
      });
    });
    await waitFor(() => {
      expect(screen.getByText("Event created successfully!")).toBeInTheDocument();
    });
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it("handles API error during form submission", async () => {
    const error = new Error("API Error");
    vi.mocked(apiClient.post).mockRejectedValueOnce(error);
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={["/society/123/create-event"]}>
          <CreateEvent />
        </MemoryRouter>
      </ThemeProvider>
    );
    const consoleErrorSpy = vi.spyOn(console, "error");
    fireEvent.click(screen.getByTestId("submit-button"));
    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith("/api/events/requests/123/", {
        title: "Test Event",
        description: "Test Description",
      });
    });
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error creating event:", error);
      expect(screen.getByText("Failed to create event.")).toBeInTheDocument();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it("handles unsuccessful response status", async () => {
    const badResponse = { status: 400, statusText: "Bad Request" };
    vi.mocked(apiClient.post).mockResolvedValueOnce(badResponse);
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={["/society/123/create-event"]}>
          <CreateEvent />
        </MemoryRouter>
      </ThemeProvider>
    );
    const consoleErrorSpy = vi.spyOn(console, "error");
    fireEvent.click(screen.getByTestId("submit-button"));
    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith("/api/events/requests/123/", {
        title: "Test Event",
        description: "Test Description",
      });
    });
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(screen.getByText("Failed to create event.")).toBeInTheDocument();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it("removes style tag on unmount", () => {
    const { unmount } = render(
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={["/society/123/create-event"]}>
          <CreateEvent />
        </MemoryRouter>
      </ThemeProvider>
    );
    const styleTagBefore = document.getElementById("event-form-styles");
    expect(styleTagBefore).toBeInTheDocument();
    unmount();
    const styleTagAfter = document.getElementById("event-form-styles");
    expect(styleTagAfter).not.toBeInTheDocument();
  });

  it("uses dark mode styles when theme is dark", () => {
    const darkTheme = createTheme({
      palette: {
        mode: "dark",
      },
    });
    render(
      <ThemeProvider theme={darkTheme}>
        <MemoryRouter initialEntries={["/society/123/create-event"]}>
          <CreateEvent />
        </MemoryRouter>
      </ThemeProvider>
    );
    const styleTag = document.getElementById("event-form-styles");
    expect(styleTag).toBeInTheDocument();
    expect(styleTag?.innerHTML).toContain("#fff !important");
  });
});
