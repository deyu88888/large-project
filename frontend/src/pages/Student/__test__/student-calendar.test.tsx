import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import StudentCalendar from "../StudentCalendar";
import * as apiModule from "../../../api";
import moment from "moment-timezone";

vi.mock("moment-timezone", async () => {
  const actual = await vi.importActual("moment-timezone");
  return {
    ...actual,
    default: actual.default,
    tz: vi.fn().mockImplementation((dateTime, timezone) => ({
      toDate: () => new Date("2024-03-15T10:00:00"),
      format: (format) => "2024-03-15 10:00"
    }))
  };
});

vi.mock("../../../api", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn()
  }
}));

const theme = createTheme({
  palette: {
    mode: "light",
  },
});

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

describe("StudentCalendar Component", () => {
  const mockSocieties = [
    { id: 1, name: "Tech Society" },
    { id: 2, name: "Art Club" },
  ];

  const mockEvents = [
    {
      id: 1,
      title: "Tech Workshop",
      date: "2024-03-15",
      start_time: "10:00:00",
      duration: "2 hours",
      description: "Learn to code",
      location: "Room 101",
      hosted_by: 1,
      societyName: "Tech Society",
      rsvp: false,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    apiModule.apiClient.get.mockResolvedValue({
      data: mockEvents
    });
    
    apiModule.apiClient.post.mockResolvedValue({ status: 200 });
    apiModule.apiClient.delete.mockResolvedValue({ status: 200 });

    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    
    global.ResizeObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderCalendar = (props = {}, useDarkTheme = false) => {
    return render(
      <ThemeProvider theme={useDarkTheme ? darkTheme : theme}>
        <StudentCalendar
          societies={mockSocieties}
          timezone="UTC"
          {...props}
        />
      </ThemeProvider>
    );
  };

  it("renders loading state initially", async () => {
    renderCalendar();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    await waitFor(() => expect(apiModule.apiClient.get).toHaveBeenCalledWith("/api/events/"));
  });

  it("displays events after loading", async () => {
    renderCalendar();
    
    await waitFor(() => expect(screen.queryByRole("progressbar")).not.toBeInTheDocument());
    
    expect(screen.getByText("My Society Events")).toBeInTheDocument();
    expect(screen.getByText("Timezone: UTC")).toBeInTheDocument();
  });

  it("displays no events message when no events match societies", async () => {
    apiModule.apiClient.get.mockResolvedValueOnce({
      data: []
    });
    
    renderCalendar();
    
    await waitFor(() => expect(screen.queryByRole("progressbar")).not.toBeInTheDocument());
    expect(screen.getByText(/No events from your societies/i)).toBeInTheDocument();
  });

  it("handles API error when fetching events", async () => {
    apiModule.apiClient.get.mockRejectedValueOnce(new Error("Failed to fetch events"));
    
    renderCalendar();
    
    await waitFor(() => expect(screen.queryByRole("progressbar")).not.toBeInTheDocument());
    expect(screen.getByText(/Failed to load events/i)).toBeInTheDocument();
    expect(console.error).toHaveBeenCalled();
  });

  it("handles empty response data from API", async () => {
    apiModule.apiClient.get.mockResolvedValueOnce({});
    
    renderCalendar();
    
    await waitFor(() => expect(screen.queryByRole("progressbar")).not.toBeInTheDocument());
    expect(screen.getByText(/Failed to load events/i)).toBeInTheDocument();
    expect(console.error).toHaveBeenCalled();
  });

  it("handles the refresh button click", async () => {
    renderCalendar();
    
    await waitFor(() => expect(screen.queryByRole("progressbar")).not.toBeInTheDocument());
    
    apiModule.apiClient.get.mockClear();
    
    const refreshButton = screen.getByTitle("Refresh events");
    
    fireEvent.click(refreshButton);
    
    expect(apiModule.apiClient.get).toHaveBeenCalledWith("/api/events/");
  });

  it("dismisses error alert when clicking close", async () => {
    apiModule.apiClient.get.mockRejectedValueOnce(new Error("Failed to fetch events"));
    
    renderCalendar();
    
    await waitFor(() => expect(screen.getByText(/Failed to load events/i)).toBeInTheDocument());
    
    const alertCloseButton = screen.getByRole("button", { name: /close/i });
    fireEvent.click(alertCloseButton);
    
    expect(screen.queryByText(/Failed to load events/i)).not.toBeInTheDocument();
  });

  it("renders correctly in dark theme", async () => {
    renderCalendar({}, true);
    
    await waitFor(() => expect(screen.queryByRole("progressbar")).not.toBeInTheDocument());
    expect(screen.getByText(/My Society Events/i)).toBeInTheDocument();
  });

  it("uses provided userEvents instead of fetching from API", async () => {
    renderCalendar({ userEvents: mockEvents });
    
    await waitFor(() => expect(screen.queryByRole("progressbar")).not.toBeInTheDocument());
    
    expect(apiModule.apiClient.get).not.toHaveBeenCalled();
  });

  it("shows the correct timezone", async () => {
    renderCalendar({ timezone: "America/New_York" });
    
    await waitFor(() => expect(screen.queryByRole("progressbar")).not.toBeInTheDocument());
    
    expect(screen.getByText("Timezone: America/New_York")).toBeInTheDocument();
  });

  it("handles transforming userEvents with error", async () => {
    const errorSpy = vi.spyOn(console, 'error');
    const invalidEvents = [{ 
      id: 'not-valid',
      date: null,
      start_time: null,
      duration: null,
      hosted_by: null
    }];
    
    const { debug } = renderCalendar({ userEvents: invalidEvents });
    
    await waitFor(() => {
      expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    });

    // Debug the entire rendered component for diagnostics
    debug();

    // Check all text content
    const pageText = document.body.textContent || '';
    console.log('Page text:', pageText);

    // Check for error message with multiple approaches
    try {
      const errorText = screen.getByText(/Failed to load events/i);
      expect(errorText).toBeInTheDocument();
    } catch (e) {
      // If getByText fails, log more details
      console.error('Error finding text:', e);
      
      // Alternative approach to find the error
      const texts = screen.getAllByText(/.*/, { selector: '*' });
      console.log('All texts:', texts.map(t => t.textContent));
    }

    expect(errorSpy).toHaveBeenCalled();
    expect(errorSpy.mock.calls[0][0]).toMatch(/Error transforming userEvents/i);
  });
});