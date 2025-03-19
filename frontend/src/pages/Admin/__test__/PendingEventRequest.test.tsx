import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import PendingEventRequest from "../PendingEventRequest";
import { SearchContext } from "../../../components/layout/SearchContext";
import { apiPaths } from "../../../api";
import { updateRequestStatus } from "../../../api/requestApi";
import { useFetchWebSocket } from "../../../hooks/useFetchWebSocket";

vi.mock("../../../hooks/useFetchWebSocket", () => ({
  useFetchWebSocket: vi.fn(),
}));

vi.mock("../../../api/requestApi", () => ({
  updateRequestStatus: vi.fn(),
}));

describe("PendingEventRequest Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the pending event requests", () => {
    const mockEvents = [
      { id: 1, title: "Event 1", description: "Desc 1", date: "2025-02-26", startTime: "10:00", duration: "2h", hostedBy: "Admin", location: "Room 1" },
      { id: 2, title: "Event 2", description: "Desc 2", date: "2025-02-27", startTime: "12:00", duration: "3h", hostedBy: "User", location: "Room 2" },
    ];

    (useFetchWebSocket as vi.Mock).mockReturnValue(mockEvents);

    render(
      <SearchContext.Provider value={{ searchTerm: "" }}>
        <PendingEventRequest />
      </SearchContext.Provider>
    );

    expect(screen.getByText("Event 1")).toBeInTheDocument();
    expect(screen.getByText("Event 2")).toBeInTheDocument();
    
    // Use getAllByText since there are multiple buttons with the same text
    expect(screen.getAllByText("Accept").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Reject").length).toBeGreaterThan(0);
  });

  it("filters events based on search term", () => {
    const mockEvents = [
      { id: 1, title: "Event 1", description: "Desc 1", date: "2025-02-26", startTime: "10:00", duration: "2h", hostedBy: "Admin", location: "Room 1" },
      { id: 2, title: "Event 2", description: "Desc 2", date: "2025-02-27", startTime: "12:00", duration: "3h", hostedBy: "User", location: "Room 2" },
    ];

    (useFetchWebSocket as vi.Mock).mockReturnValue(mockEvents);

    render(
      <SearchContext.Provider value={{ searchTerm: "Event 1" }}>
        <PendingEventRequest />
      </SearchContext.Provider>
    );

    expect(screen.getByText("Event 1")).toBeInTheDocument();
    expect(screen.queryByText("Event 2")).not.toBeInTheDocument();
  });

  it("calls updateRequestStatus when accept and reject buttons are clicked", async () => {
    const mockEvents = [
      { id: 1, title: "Event 1", description: "Desc 1", date: "2025-02-26", startTime: "10:00", duration: "2h", hostedBy: "Admin", location: "Room 1" },
    ];

    (useFetchWebSocket as vi.Mock).mockReturnValue(mockEvents);

    render(
      <SearchContext.Provider value={{ searchTerm: "" }}>
        <PendingEventRequest />
      </SearchContext.Provider>
    );

    const acceptButtons = screen.getAllByText("Accept");
    fireEvent.click(acceptButtons[0]);
    expect(updateRequestStatus).toHaveBeenCalledWith(1, "Approved", apiPaths.EVENTS.UPDATEENEVENTREQUEST);

    const rejectButtons = screen.getAllByText("Reject");
    fireEvent.click(rejectButtons[0]);
    expect(updateRequestStatus).toHaveBeenCalledWith(1, "Rejected", apiPaths.EVENTS.UPDATEENEVENTREQUEST);
  });

  it("displays an alert when updateRequestStatus fails", async () => {
    const mockEvents = [
      { id: 1, title: "Event 1", description: "Desc 1", date: "2025-02-26", startTime: "10:00", duration: "2h", hostedBy: "Admin", location: "Room 1" },
    ];

    (useFetchWebSocket as vi.Mock).mockReturnValue(mockEvents);
    (updateRequestStatus as vi.Mock).mockRejectedValue(new Error("Network Error"));

    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    render(
      <SearchContext.Provider value={{ searchTerm: "" }}>
        <PendingEventRequest />
      </SearchContext.Provider>
    );

    const acceptButtons = screen.getAllByText("Accept");
    fireEvent.click(acceptButtons[0]);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Failed to approved event.");
    });

    alertSpy.mockRestore();
  });
});