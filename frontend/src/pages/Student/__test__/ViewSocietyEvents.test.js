import { jsx as _jsx } from "react/jsx-runtime";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material";
import ViewSocietyEvents from "../ViewSocietyEvents";
import { apiClient } from "../../../api";
import { useAuthStore } from "../../../stores/auth-store";
import { vi } from "vitest";
import * as router from "react-router-dom";
// Mock dependencies
vi.mock("../../../api", () => ({
    apiClient: {
        get: vi.fn(),
        post: vi.fn(),
        delete: vi.fn()
    }
}));
vi.mock("../../../stores/auth-store", () => ({
    useAuthStore: vi.fn()
}));
// Mock the navigate function
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useParams: vi.fn()
    };
});
describe("ViewSocietyEvents Component", () => {
    const mockTheme = createTheme({
        palette: {
            mode: "light",
        },
    });
    const mockUser = {
        id: 1,
        username: "testuser",
        role: "student"
    };
    const mockEvents = [
        {
            id: 1,
            title: "Test Event 1",
            description: "Description for event 1",
            date: "2025-04-01",
            start_time: "14:00",
            duration: "2 hours",
            location: "Building A",
            hosted_by: 1,
            status: "Approved",
            rsvp: false
        },
        {
            id: 2,
            title: "Test Event 2",
            description: "Description for event 2",
            date: "2025-04-02",
            start_time: "15:00",
            duration: "1 hour",
            location: "Building B",
            hosted_by: 1,
            status: "Approved",
            rsvp: true
        }
    ];
    const mockSociety = {
        id: 1,
        name: "Test Society"
    };
    beforeEach(() => {
        vi.clearAllMocks();
        // Setup auth store mock
        useAuthStore.mockReturnValue({
            user: mockUser
        });
        // Default route params
        vi.spyOn(router, "useParams").mockReturnValue({
            society_id: "1",
            event_type: "upcoming-events"
        });
        // Setup API client mocks
        apiClient.get.mockImplementation((url) => {
            if (url.includes("/api/societies/")) {
                return Promise.resolve({ data: mockSociety });
            }
            else if (url.includes("/api/events")) {
                return Promise.resolve({ data: mockEvents });
            }
            return Promise.reject(new Error("Unknown endpoint"));
        });
        apiClient.post.mockResolvedValue({ status: 200 });
        apiClient.delete.mockResolvedValue({ status: 200 });
    });
    const renderComponent = async () => {
        let result;
        await act(async () => {
            result = render(_jsx(ThemeProvider, { theme: mockTheme, children: _jsx(ViewSocietyEvents, {}) }));
            // Wait for all promises to resolve
            await new Promise(resolve => setTimeout(resolve, 0));
        });
        return result;
    };
    it("renders loading state initially", async () => {
        // Mock loading state that doesn't resolve immediately
        apiClient.get.mockImplementation(() => {
            return new Promise(resolve => {
                setTimeout(() => {
                    resolve({ data: mockEvents });
                }, 100);
            });
        });
        render(_jsx(ThemeProvider, { theme: mockTheme, children: _jsx(ViewSocietyEvents, {}) }));
        expect(screen.getByRole("progressbar")).toBeInTheDocument();
    });
    it("renders events after loading", async () => {
        await renderComponent();
        expect(screen.getByText("Test Event 1")).toBeInTheDocument();
        expect(screen.getByText("Test Event 2")).toBeInTheDocument();
        expect(screen.getByText("Description for event 1")).toBeInTheDocument();
        expect(screen.getByText("Description for event 2")).toBeInTheDocument();
    });
    it("displays the correct page title for upcoming events", async () => {
        vi.spyOn(router, "useParams").mockReturnValue({
            society_id: "1",
            event_type: "upcoming-events"
        });
        await renderComponent();
        expect(screen.getByText(/Test Society - Upcoming Events/i)).toBeInTheDocument();
    });
    it("displays the correct page title for previous events", async () => {
        vi.spyOn(router, "useParams").mockReturnValue({
            society_id: "1",
            event_type: "previous-events"
        });
        await renderComponent();
        expect(screen.getByText(/Test Society - Previous Events/i)).toBeInTheDocument();
    });
    it("displays empty state when no events are found", async () => {
        apiClient.get.mockImplementation((url) => {
            if (url.includes("/api/societies/")) {
                return Promise.resolve({ data: mockSociety });
            }
            else if (url.includes("/api/events")) {
                return Promise.resolve({ data: [] });
            }
            return Promise.reject(new Error("Unknown endpoint"));
        });
        await renderComponent();
        expect(screen.getByText("No events found.")).toBeInTheDocument();
    });
    it("displays error state when API call fails", async () => {
        apiClient.get.mockImplementation((url) => {
            if (url.includes("/api/societies/")) {
                return Promise.resolve({ data: mockSociety });
            }
            else if (url.includes("/api/events")) {
                return Promise.reject(new Error("API error"));
            }
            return Promise.reject(new Error("Unknown endpoint"));
        });
        await renderComponent();
        expect(screen.getByText("Failed to load events. Please try again later.")).toBeInTheDocument();
    });
    it("handles RSVP button click", async () => {
        await renderComponent();
        const rsvpButton = screen.getByText("RSVP Now");
        await act(async () => {
            fireEvent.click(rsvpButton);
            // Wait for async operations to complete
            await new Promise(resolve => setTimeout(resolve, 0));
        });
        expect(apiClient.post).toHaveBeenCalledWith("/api/events/rsvp", { event_id: 1 });
    });
    it("navigates back when back button is clicked", async () => {
        await renderComponent();
        const backButton = screen.getByText("Back");
        await act(async () => {
            fireEvent.click(backButton);
            // Wait for async operations to complete
            await new Promise(resolve => setTimeout(resolve, 0));
        });
        expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
});
