import React from "react";
import { render, screen, waitFor, act, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import ViewNotifications from "../ViewNotifications";
import { apiClient } from "../../../api";

vi.mock("../../../api", () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

const lightTheme = createTheme({ palette: { mode: "light" } });
const darkTheme = createTheme({ palette: { mode: "dark" } });

describe("ViewNotifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (apiClient.get as vi.Mock).mockImplementation((url: string) => {
      if (url === "/api/notifications") {
        return Promise.resolve({
          data: [
            { id: 1, message: "Notification 1", is_read: false },
            { id: 2, message: "Notification 2", is_read: true },
          ],
        });
      }
      return Promise.resolve({ data: [] });
    });

    (apiClient.patch as vi.Mock).mockImplementation((url: string, data: any) => {
      if (url === "/api/notifications/1") {
        return Promise.resolve({ status: 200 });
      }
      return Promise.resolve({ status: 200 });
    });
  });

  const renderComponent = (theme = lightTheme) =>
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <ViewNotifications />
        </MemoryRouter>
      </ThemeProvider>
    );

  it("displays a loading indicator initially", async () => {
    (apiClient.get as vi.Mock).mockImplementationOnce(() =>
      new Promise((resolve) => setTimeout(() => resolve({ data: [] }), 200))
    );
    renderComponent();
    expect(screen.getByText(/Loading notifications/i)).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByText(/Loading notifications/i)).not.toBeInTheDocument()
    );
  });

  it("renders a list of notifications when available", async () => {
    renderComponent();
    await waitFor(() =>
      expect(screen.getByText(/All Notifications/i)).toBeInTheDocument()
    );
    expect(screen.getByText("Notification 1")).toBeInTheDocument();
    expect(screen.getByText("Notification 2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Mark as Read/i })).toBeInTheDocument();
    expect(screen.getAllByText("Read").length).toBeGreaterThanOrEqual(1);
  });

  it('renders "No new notifications." when there are no notifications', async () => {
    (apiClient.get as vi.Mock).mockImplementationOnce(() =>
      Promise.resolve({ data: [] })
    );
    renderComponent();
    await waitFor(() =>
      expect(screen.getByText(/All Notifications/i)).toBeInTheDocument()
    );
    expect(screen.getByText(/No new notifications./i)).toBeInTheDocument();
  });

  it("marks a notification as read when the 'Mark as Read' button is clicked", async () => {
    renderComponent();
    await waitFor(() =>
      expect(screen.getByText(/All Notifications/i)).toBeInTheDocument()
    );
    const markAsReadButton = screen.getByRole("button", { name: /Mark as Read/i });
    await act(async () => {
      fireEvent.click(markAsReadButton);
    });
    expect(apiClient.patch).toHaveBeenCalledWith("/api/notifications/1", { is_read: true });
  });

  it("logs an error if marking a notification as read fails", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    (apiClient.patch as vi.Mock).mockImplementationOnce(() =>
      Promise.reject(new Error("Patch failed"))
    );
    renderComponent();
    await waitFor(() =>
      expect(screen.getByText(/All Notifications/i)).toBeInTheDocument()
    );
    const markAsReadButton = screen.getByRole("button", { name: /Mark as Read/i });
    await act(async () => {
      fireEvent.click(markAsReadButton);
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error marking notification as read:",
      expect.any(Error)
    );
    consoleErrorSpy.mockRestore();
  });

  it("handles errors when fetching notifications", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    (apiClient.get as vi.Mock).mockImplementationOnce(() =>
      Promise.reject({ response: { data: "API Error" } })
    );
    renderComponent();
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error fetching notifications:",
        "API Error"
      );
    });
    consoleErrorSpy.mockClear();
    (apiClient.get as vi.Mock).mockImplementationOnce(() =>
      Promise.reject(new Error("Network error"))
    );
    renderComponent();
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error fetching notifications:",
        expect.any(Error)
      );
    });
    consoleErrorSpy.mockRestore();
  });

  it("handles non-200 response when marking notification as read", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    (apiClient.patch as vi.Mock).mockImplementationOnce(() =>
      Promise.resolve({ status: 400 })
    );
    renderComponent();
    await waitFor(() =>
      expect(screen.getByText(/All Notifications/i)).toBeInTheDocument()
    );
    const markAsReadButton = screen.getByRole("button", { name: /Mark as Read/i });
    await act(async () => {
      fireEvent.click(markAsReadButton);
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to mark notification as read");
    consoleErrorSpy.mockRestore();
  });

  it("renders correctly with dark theme", async () => {
    renderComponent(darkTheme);
    await waitFor(() =>
      expect(screen.getByText(/All Notifications/i)).toBeInTheDocument()
    );
    expect(screen.getByText("Notification 1")).toBeInTheDocument();
  });
});
