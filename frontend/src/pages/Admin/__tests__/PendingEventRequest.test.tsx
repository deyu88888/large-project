import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import PendingEventRequest from "../PendingEventRequest";
import { SearchContext } from "../../../components/layout/SearchContext";
import { ThemeProvider, createTheme } from "@mui/material/styles";

const mockFetchPendingRequests = vi.fn();
const mockApiPut = vi.fn();

vi.mock("../../../utils/utils.ts", () => ({
  fetchPendingRequests: () => mockFetchPendingRequests()
}));

vi.mock("../../../api", () => ({
  apiClient: {
    put: (...args) => mockApiPut(...args)
  }
}));

vi.mock("../../../stores/settings-store", () => ({
  useSettingsStore: () => ({
    drawer: false
  })
}));

vi.mock("../../../utils/mapper.ts", () => ({
  mapToEventRequestData: (data) => ({
    eventId: data.id,
    title: data.title,
    mainDescription: data.main_description,
    date: data.date,
    startTime: data.start_time,
    duration: data.duration,
    hostedBy: data.hosted_by,
    location: data.location
  })
}));

describe("PendingEventRequest Component", () => {
  const theme = createTheme();
  
  const mockEvents = [
    { id: 1, title: "Event 1", main_description: "Desc 1", date: "2025-02-26", start_time: "10:00", duration: "2h", hosted_by: "Admin", location: "Room 1" },
    { id: 2, title: "Event 2", main_description: "Desc 2", date: "2025-02-27", start_time: "12:00", duration: "3h", hosted_by: "User", location: "Room 2" }
  ];
  
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchPendingRequests.mockResolvedValue(mockEvents);
    mockApiPut.mockResolvedValue({ data: { success: true } });
  });

  it("renders the pending event requests", async () => {
    await act(async () => {
      render(
        <ThemeProvider theme={theme}>
          <SearchContext.Provider value={{ searchTerm: "" }}>
            <PendingEventRequest />
          </SearchContext.Provider>
        </ThemeProvider>
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Event 1")).toBeInTheDocument();
      expect(screen.getByText("Event 2")).toBeInTheDocument();
    });
    
    expect(screen.getAllByText("Accept").length).toBe(2);
    expect(screen.getAllByText("Reject").length).toBe(2);
  });

  it("filters events based on search term", async () => {
    await act(async () => {
      render(
        <ThemeProvider theme={theme}>
          <SearchContext.Provider value={{ searchTerm: "Event 1" }}>
            <PendingEventRequest />
          </SearchContext.Provider>
        </ThemeProvider>
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Event 1")).toBeInTheDocument();
      expect(screen.queryByText("Event 2")).not.toBeInTheDocument();
    });
  });

  it("calls API when accept and reject buttons are clicked", async () => {
    await act(async () => {
      render(
        <ThemeProvider theme={theme}>
          <SearchContext.Provider value={{ searchTerm: "" }}>
            <PendingEventRequest />
          </SearchContext.Provider>
        </ThemeProvider>
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Event 1")).toBeInTheDocument();
    });

    const acceptButtons = screen.getAllByText("Accept");
    await act(async () => {
      fireEvent.click(acceptButtons[0]);
    });
    
    expect(mockApiPut).toHaveBeenCalledWith("/api/admin/society/event/request/1", {
      status: "Approved"
    });

    const rejectButtons = screen.getAllByText("Reject");
    await act(async () => {
      fireEvent.click(rejectButtons[1]);
    });
    
    expect(mockApiPut).toHaveBeenCalledWith("/api/admin/society/event/request/2", {
      status: "Rejected",
      rejection_reason: "Event rejected by admin"
    });
  });

  it("handles error when API call fails", async () => {
    mockApiPut.mockRejectedValueOnce(new Error("Network Error"));
    
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    await act(async () => {
      render(
        <ThemeProvider theme={theme}>
          <SearchContext.Provider value={{ searchTerm: "" }}>
            <PendingEventRequest />
          </SearchContext.Provider>
        </ThemeProvider>
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Event 1")).toBeInTheDocument();
    });

    const acceptButtons = screen.getAllByText("Accept");
    
    await act(async () => {
      fireEvent.click(acceptButtons[0]);
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(mockApiPut).toHaveBeenCalledWith("/api/admin/society/event/request/1", {
      status: "Approved"
    });
  

    consoleErrorSpy.mockRestore();
  });
});