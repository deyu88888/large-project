import { jsx as _jsx } from "react/jsx-runtime";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import ViewInbox from "../ViewInbox";
import { apiClient } from "../../../api";
import { vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
// Mock the navigation function
const mockNavigate = vi.fn();
// Mock the API client
vi.mock("../../../api", () => ({
    apiClient: {
        get: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
    }
}));
// Mock react-router-dom hooks
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});
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
    const mockReplyNotifications = [
        {
            id: 3,
            header: "New Reply",
            body: "Someone replied to your report",
            is_read: false,
            type: "report_reply",
            report_id: 123
        }
    ];
    beforeEach(() => {
        vi.clearAllMocks();
        // Set up default mock responses
        apiClient.get.mockImplementation((url) => {
            if (url === "/api/inbox") {
                return Promise.resolve({ data: mockNotifications });
            }
            else if (url === "/api/report-reply-notifications") {
                return Promise.resolve({ data: mockReplyNotifications });
            }
            return Promise.resolve({ data: [] });
        });
        apiClient.patch.mockResolvedValue({ status: 200 });
        apiClient.delete.mockResolvedValue({ status: 204 });
    });
    const renderWithRouter = () => {
        return render(_jsx(ThemeProvider, { theme: mockTheme, children: _jsx(MemoryRouter, { children: _jsx(ViewInbox, {}) }) }));
    };
    it("renders loading state", () => {
        // Delay the API response to show loading state
        apiClient.get.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ data: [] }), 100)));
        renderWithRouter();
        expect(screen.getByText("Loading notifications...")).toBeInTheDocument();
    });
    it("displays empty state when no notifications are available", async () => {
        // Override the default mock to return empty arrays
        apiClient.get.mockImplementation(() => Promise.resolve({ data: [] }));
        renderWithRouter();
        await waitFor(() => {
            expect(screen.getByText("No new notifications.")).toBeInTheDocument();
        });
    });
    it("renders notifications correctly", async () => {
        renderWithRouter();
        await waitFor(() => {
            expect(screen.getByText("Important Notice")).toBeInTheDocument();
            expect(screen.getByText("This is an important notification")).toBeInTheDocument();
            expect(screen.getByText("System Update")).toBeInTheDocument();
            expect(screen.getByText("The system will be updated tonight")).toBeInTheDocument();
            expect(screen.getByText("New Reply")).toBeInTheDocument();
        });
        expect(screen.getByText("Read")).toBeInTheDocument();
        expect(screen.getAllByText("Mark as Read").length).toBe(2);
    });
    it("handles API error when fetching notifications", async () => {
        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => { });
        // Make the first get call fail
        apiClient.get.mockRejectedValueOnce(new Error("API error"));
        renderWithRouter();
        await waitFor(() => {
            expect(screen.getByText("No new notifications.")).toBeInTheDocument();
        });
        expect(consoleErrorSpy).toHaveBeenCalled();
        consoleErrorSpy.mockRestore();
    });
    it("marks notification as read when clicking 'Mark as Read' button", async () => {
        renderWithRouter();
        await waitFor(() => {
            expect(screen.getAllByText("Mark as Read").length).toBe(2);
        });
        fireEvent.click(screen.getAllByText("Mark as Read")[0]);
        await waitFor(() => {
            expect(apiClient.patch).toHaveBeenCalledWith("/api/notifications/1", { is_read: true });
        });
    });
    it("handles error when marking notification as read", async () => {
        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => { });
        // Make the patch call fail
        apiClient.patch.mockRejectedValueOnce(new Error("API error"));
        renderWithRouter();
        await waitFor(() => {
            expect(screen.getAllByText("Mark as Read").length).toBe(2);
        });
        fireEvent.click(screen.getAllByText("Mark as Read")[0]);
        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalled();
        });
        consoleErrorSpy.mockRestore();
    });
    it("updates UI after marking notification as read", async () => {
        renderWithRouter();
        await waitFor(() => {
            expect(screen.getAllByText("Mark as Read").length).toBe(2);
        });
        // Simulate successful marking as read
        fireEvent.click(screen.getAllByText("Mark as Read")[0]);
        await waitFor(() => {
            // After the update, we should have one more "Read" text
            expect(screen.getAllByText("Read").length).toBe(2);
            expect(screen.getAllByText("Mark as Read").length).toBe(1);
        });
    });
    it("handles deleting a notification", async () => {
        renderWithRouter();
        await waitFor(() => {
            expect(screen.getByText("Important Notice")).toBeInTheDocument();
        });
        // Find and click the delete button for the first notification
        const deleteButtons = screen.getAllByTitle("Delete notification");
        fireEvent.click(deleteButtons[0]);
        await waitFor(() => {
            expect(apiClient.delete).toHaveBeenCalledWith("/api/inbox/1");
        });
    });
    it("navigates to report thread when clicking View Reply button", async () => {
        renderWithRouter();
        await waitFor(() => {
            expect(screen.getByText("New Reply")).toBeInTheDocument();
        });
        // Find and click the "View Reply" button
        fireEvent.click(screen.getByText("View Reply"));
        expect(mockNavigate).toHaveBeenCalledWith("/student/report-thread/123");
    });
});
