import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import ViewInbox from "../ViewInbox";
import { apiClient } from "../../../api";
import { vi } from "vitest";

vi.mock("../../../api", () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn()
  }
}));

describe("ViewInbox Component", () => {
  const mockTheme = createTheme({
    palette: {
      mode: "light",
    },
  });

  const mockNotifications = [
    {
      id: 1,
      header: "Important Notice",
      body: "This is an important notification",
      is_read: false,
    },
    {
      id: 2,
      header: "System Update",
      body: "The system will be updated tonight",
      is_read: true,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state", () => {
    apiClient.get.mockReturnValue(Promise.resolve({ data: [] }));

    render(
      <ThemeProvider theme={mockTheme}>
        <ViewInbox />
      </ThemeProvider>
    );

    expect(screen.getByText("Loading notifications...")).toBeInTheDocument();
  });

  it("displays empty state when no notifications are available", async () => {
    apiClient.get.mockReturnValue(Promise.resolve({ data: [] }));

    render(
      <ThemeProvider theme={mockTheme}>
        <ViewInbox />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("No new notifications.")).toBeInTheDocument();
    });
  });

  it("renders notifications correctly", async () => {
    apiClient.get.mockReturnValue(Promise.resolve({ data: mockNotifications }));

    render(
      <ThemeProvider theme={mockTheme}>
        <ViewInbox />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Important Notice")).toBeInTheDocument();
      expect(screen.getByText("This is an important notification")).toBeInTheDocument();
      expect(screen.getByText("System Update")).toBeInTheDocument();
      expect(screen.getByText("The system will be updated tonight")).toBeInTheDocument();
    });

    expect(screen.getByText("Read")).toBeInTheDocument();
    expect(screen.getByText("Mark as Read")).toBeInTheDocument();
  });

  it("handles API error when fetching notifications", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    apiClient.get.mockRejectedValue(new Error("API error"));

    render(
      <ThemeProvider theme={mockTheme}>
        <ViewInbox />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("No new notifications.")).toBeInTheDocument();
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it("marks notification as read when clicking 'Mark as Read' button", async () => {
    apiClient.get.mockReturnValue(Promise.resolve({ data: mockNotifications }));
    apiClient.patch.mockReturnValue(Promise.resolve({ status: 200 }));

    render(
      <ThemeProvider theme={mockTheme}>
        <ViewInbox />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Mark as Read")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Mark as Read"));

    await waitFor(() => {
      expect(apiClient.patch).toHaveBeenCalledWith("/api/notifications/1", { is_read: true });
    });
  });

  it("handles error when marking notification as read", async () => {
    apiClient.get.mockReturnValue(Promise.resolve({ data: mockNotifications }));
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    apiClient.patch.mockRejectedValue(new Error("API error"));

    render(
      <ThemeProvider theme={mockTheme}>
        <ViewInbox />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Mark as Read")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Mark as Read"));

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    consoleErrorSpy.mockRestore();
  });

  it("updates UI after marking notification as read", async () => {
    apiClient.get.mockReturnValue(Promise.resolve({ data: mockNotifications }));
    apiClient.patch.mockReturnValue(Promise.resolve({ status: 200 }));

    render(
      <ThemeProvider theme={mockTheme}>
        <ViewInbox />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Mark as Read")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Mark as Read"));

    await waitFor(() => {
      expect(screen.getAllByText("Read").length).toBe(2);
      expect(screen.queryByText("Mark as Read")).not.toBeInTheDocument();
    });
  });

  it("handles failed API response when marking as read", async () => {
    apiClient.get.mockReturnValue(Promise.resolve({ data: mockNotifications }));
    apiClient.patch.mockReturnValue(Promise.resolve({ status: 400 }));
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ThemeProvider theme={mockTheme}>
        <ViewInbox />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Mark as Read")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Mark as Read"));

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to mark notification as read");
    });

    expect(screen.getByText("Mark as Read")).toBeInTheDocument();
    consoleErrorSpy.mockRestore();
  });
});