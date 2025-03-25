import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import PendingEventRequest from "../PendingEventRequest";
import { SearchContext } from "../../../components/layout/SearchContext";
import { apiPaths } from "../../../api";
import { updateRequestStatus } from "../../../api/requestApi";
import { useFetchWebSocket } from "../../../hooks/useFetchWebSocket";
import { ThemeProvider, createTheme } from "@mui/material/styles";

vi.mock("../../../hooks/useFetchWebSocket", () => ({
  useFetchWebSocket: vi.fn(),
}));

vi.mock("../../../api/requestApi", () => ({
  updateRequestStatus: vi.fn(),
}));

// Mock useSettingsStore
vi.mock("../../../stores/settings-store", () => ({
  useSettingsStore: () => ({
    drawer: false
  })
}));

describe("PendingEventRequest Component", () => {
  const theme = createTheme();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the pending event requests", async () => {
    const mockEvents = [
      { id: 1, title: "Event 1", main_description: "Desc 1", date: "2025-02-26", start_time: "10:00", duration: "2h", hosted_by: "Admin", location: "Room 1" },
      { id: 2, title: "Event 2", main_description: "Desc 2", date: "2025-02-27", start_time: "12:00", duration: "3h", hosted_by: "User", location: "Room 2" },
    ];

    (useFetchWebSocket as vi.Mock).mockReturnValue(mockEvents);

    await act(async () => {
      render(
        <ThemeProvider theme={theme}>
          <SearchContext.Provider value={{ searchTerm: "" }}>
            <PendingEventRequest />
          </SearchContext.Provider>
        </ThemeProvider>
      );
    });

    expect(screen.getByText("Event 1")).toBeInTheDocument();
    expect(screen.getByText("Event 2")).toBeInTheDocument();
    
    // Use getAllByText since there are multiple buttons with the same text
    expect(screen.getAllByText("Accept").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Reject").length).toBeGreaterThan(0);
  });

  it("filters events based on search term", async () => {
    const mockEvents = [
      { id: 1, title: "Event 1", main_description: "Desc 1", date: "2025-02-26", start_time: "10:00", duration: "2h", hosted_by: "Admin", location: "Room 1" },
      { id: 2, title: "Event 2", main_description: "Desc 2", date: "2025-02-27", start_time: "12:00", duration: "3h", hosted_by: "User", location: "Room 2" },
    ];

    (useFetchWebSocket as vi.Mock).mockReturnValue(mockEvents);

    await act(async () => {
      render(
        <ThemeProvider theme={theme}>
          <SearchContext.Provider value={{ searchTerm: "Event 1" }}>
            <PendingEventRequest />
          </SearchContext.Provider>
        </ThemeProvider>
      );
    });

    expect(screen.getByText("Event 1")).toBeInTheDocument();
    expect(screen.queryByText("Event 2")).not.toBeInTheDocument();
  });

  it("calls updateRequestStatus when accept and reject buttons are clicked", async () => {
    const mockEvents = [
      { id: 1, title: "Event 1", main_description: "Desc 1", date: "2025-02-26", start_time: "10:00", duration: "2h", hosted_by: "Admin", location: "Room 1" },
    ];

    (useFetchWebSocket as vi.Mock).mockReturnValue(mockEvents);
    (updateRequestStatus as vi.Mock).mockResolvedValue({ data: { success: true } });

    await act(async () => {
      render(
        <ThemeProvider theme={theme}>
          <SearchContext.Provider value={{ searchTerm: "" }}>
            <PendingEventRequest />
          </SearchContext.Provider>
        </ThemeProvider>
      );
    });

    const acceptButtons = screen.getAllByText("Accept");
    await act(async () => {
      fireEvent.click(acceptButtons[0]);
    });
    
    expect(updateRequestStatus).toHaveBeenCalledWith(1, "Approved", apiPaths.EVENTS.UPDATEENEVENTREQUEST);

    const rejectButtons = screen.getAllByText("Reject");
    await act(async () => {
      fireEvent.click(rejectButtons[0]);
    });
    
    expect(updateRequestStatus).toHaveBeenCalledWith(1, "Rejected", apiPaths.EVENTS.UPDATEENEVENTREQUEST);
  });

  it("displays an alert when updateRequestStatus fails", async () => {
    const mockEvents = [
      { id: 1, title: "Event 1", main_description: "Desc 1", date: "2025-02-26", start_time: "10:00", duration: "2h", hosted_by: "Admin", location: "Room 1" },
    ];

    (useFetchWebSocket as vi.Mock).mockReturnValue(mockEvents);
    (updateRequestStatus as vi.Mock).mockRejectedValue(new Error("Network Error"));

    // Spy on console.error to avoid cluttering test output
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Use the actual window.alert for this test
    const alertSpy = vi.fn();
    global.alert = alertSpy;

    await act(async () => {
      render(
        <ThemeProvider theme={theme}>
          <SearchContext.Provider value={{ searchTerm: "" }}>
            <PendingEventRequest />
          </SearchContext.Provider>
        </ThemeProvider>
      );
    });

    const acceptButtons = screen.getAllByText("Accept");
    
    await act(async () => {
      fireEvent.click(acceptButtons[0]);
    });

    // Check if the alertSpy was called with the correct message
    expect(alertSpy).toHaveBeenCalledWith("Failed to approve event.");

    consoleErrorSpy.mockRestore();
  });
});