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

    expect(screen.getByText("Pending Event Requests")).toBeInTheDocument();
    expect(screen.getByText("Event 1")).toBeInTheDocument();
    expect(screen.getByText("Event 2")).toBeInTheDocument();
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

    const acceptButton = screen.getByText("Accept");
    fireEvent.click(acceptButton);
    expect(updateRequestStatus).toHaveBeenCalledWith(1, "Approved", apiPaths.EVENTS.UPDATEENEVENTREQUEST);

    const rejectButton = screen.getByText("Reject");
    fireEvent.click(rejectButton);
    expect(updateRequestStatus).toHaveBeenCalledWith(1, "Rejected", apiPaths.EVENTS.UPDATEENEVENTREQUEST);
  });

  it("displays an alert when updateRequestStatus fails", async () => {
    const mockEvents = [
      { id: 1, title: "Event 1", description: "Desc 1", date: "2025-02-26", startTime: "10:00", duration: "2h", hostedBy: "Admin", location: "Room 1" },
    ];

    (useFetchWebSocket as vi.Mock).mockReturnValue(mockEvents);
    (updateRequestStatus as vi.Mock).mockRejectedValue(new Error("Network Error"));

    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {}); // Ensure alert is mocked

    render(
      <SearchContext.Provider value={{ searchTerm: "" }}>
        <PendingEventRequest />
      </SearchContext.Provider>
    );

    const acceptButton = screen.getByText("Accept");
    fireEvent.click(acceptButton);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Failed to approved event.");
    });

    alertSpy.mockRestore(); // Cleanup after test
  });
});