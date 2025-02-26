import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import PendingSocietyRequest from "../PendingSocietyRequest";
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

describe("PendingSocietyRequest Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders empty state when societies array is empty", () => {
    (useFetchWebSocket as vi.Mock).mockReturnValue([]);

    render(
      <SearchContext.Provider value={{ searchTerm: "" }}>
        <PendingSocietyRequest />
      </SearchContext.Provider>
    );

    expect(screen.getByText("Pending Society Requests")).toBeInTheDocument();
  });

  it("handles undefined societies gracefully", () => {
    (useFetchWebSocket as vi.Mock).mockReturnValue(undefined);

    render(
      <SearchContext.Provider value={{ searchTerm: "" }}>
        <PendingSocietyRequest />
      </SearchContext.Provider>
    );

    expect(screen.getByText("Pending Society Requests")).toBeInTheDocument();
  });

  it("handles null societies gracefully", () => {
    (useFetchWebSocket as vi.Mock).mockReturnValue(null);

    render(
      <SearchContext.Provider value={{ searchTerm: "" }}>
        <PendingSocietyRequest />
      </SearchContext.Provider>
    );

    expect(screen.getByText("Pending Society Requests")).toBeInTheDocument();
  });

  it("renders the pending society requests", () => {
    const mockSocieties = [
      { id: 1, name: "Society 1", leader: "Leader 1", category: "Tech", society_members: ["Member1", "Member2"] },
      { id: 2, name: "Society 2", leader: "Leader 2", category: "Science", society_members: "" },
    ];

    (useFetchWebSocket as vi.Mock).mockReturnValue(mockSocieties);

    render(
      <SearchContext.Provider value={{ searchTerm: "" }}>
        <PendingSocietyRequest />
      </SearchContext.Provider>
    );

    expect(screen.getByText("Pending Society Requests")).toBeInTheDocument();
    expect(screen.getByText("Society 1")).toBeInTheDocument();
    expect(screen.getByText("Society 2")).toBeInTheDocument();
  });

  it("handles societies with empty members array", () => {
    const mockSocieties = [
      { id: 1, name: "Society 1", leader: "Leader 1", category: "Tech", society_members: "" },
    ];

    (useFetchWebSocket as vi.Mock).mockReturnValue(mockSocieties);

    render(
      <SearchContext.Provider value={{ searchTerm: "" }}>
        <PendingSocietyRequest />
      </SearchContext.Provider>
    );

    expect(screen.getByText("Society 1")).toBeInTheDocument();
  });

  it("formats society members correctly", () => {
    const mockSocieties = [
      { id: 1, name: "Society 1", leader: "Leader 1", category: "Tech", society_members: ["Member1", "Member2"] },
    ];

    (useFetchWebSocket as vi.Mock).mockReturnValue(mockSocieties);

    render(
      <SearchContext.Provider value={{ searchTerm: "" }}>
        <PendingSocietyRequest />
      </SearchContext.Provider>
    );

    expect(screen.getByText("Member1, Member2")).toBeInTheDocument();
  });

  it("calls updateRequestStatus when accept and reject buttons are clicked", async () => {
    const mockSocieties = [
      { id: 1, name: "Society 1", leader: "Leader 1", category: "Tech", society_members: ["Member1", "Member2"] },
    ];

    (useFetchWebSocket as vi.Mock).mockReturnValue(mockSocieties);

    render(
      <SearchContext.Provider value={{ searchTerm: "" }}>
        <PendingSocietyRequest />
      </SearchContext.Provider>
    );

    const acceptButton = screen.getByText("Accept");
    fireEvent.click(acceptButton);
    expect(updateRequestStatus).toHaveBeenCalledWith(1, "Approved", apiPaths.USER.PENDINGSOCIETYREQUEST);

    const rejectButton = screen.getByText("Reject");
    fireEvent.click(rejectButton);
    expect(updateRequestStatus).toHaveBeenCalledWith(1, "Rejected", apiPaths.USER.PENDINGSOCIETYREQUEST);
  });

  it("displays an alert when updateRequestStatus fails", async () => {
    const mockSocieties = [
      { id: 1, name: "Society 1", leader: "Leader 1", category: "Tech", society_members: ["Member1", "Member2"] },
    ];

    (useFetchWebSocket as vi.Mock).mockReturnValue(mockSocieties);
    (updateRequestStatus as vi.Mock).mockRejectedValue(new Error("Network Error"));

    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    render(
      <SearchContext.Provider value={{ searchTerm: "" }}>
        <PendingSocietyRequest />
      </SearchContext.Provider>
    );

    const acceptButton = screen.getByText("Accept");
    fireEvent.click(acceptButton);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Failed to approved society request.");
    });

    alertSpy.mockRestore();
  });
});