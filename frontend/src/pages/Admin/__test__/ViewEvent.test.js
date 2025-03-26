import { jsx as _jsx } from "react/jsx-runtime";
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ViewEvent from '../ViewEvent';
import { apiClient } from '../../../api';
const theme = createTheme({
    palette: {
        mode: 'light',
    }
});
const darkTheme = createTheme({
    palette: {
        mode: 'dark',
    }
});
// Mock the API client
vi.mock('../../../api', () => ({
    apiClient: {
        get: vi.fn(),
        patch: vi.fn(),
        request: vi.fn(),
    },
    apiPaths: {
        USER: {
            ADMINEVENTVIEW: (id) => `/api/admin-events/${id}`,
        },
    },
}));
// Mock the auth store
vi.mock('../../../stores/auth-store', () => ({
    useAuthStore: vi.fn().mockReturnValue({
        user: { id: '123', name: 'Test User', role: 'admin' },
    }),
}));
// Mock navigate and useParams
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useParams: () => ({ event_id: '123' }),
    };
});
// Mock theme
vi.mock('../../../theme/theme', () => ({
    tokens: (mode) => ({
        primary: {
            main: '#1976d2',
        },
        secondary: {
            main: '#dc004e',
        },
        background: {
            default: mode === 'dark' ? '#121212' : '#f5f5f5',
            paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
        },
    }),
}));
describe('ViewEvent Component', () => {
    const mockEventId = '123';
    const mockAlert = vi.fn();
    const mockEvent = {
        id: 123,
        title: 'Test Event',
        description: 'This is a test event',
        date: '2025-12-31',
        startTime: '14:00',
        duration: '2 hours',
        location: 'Test Location',
        hostedBy: 'Test Host',
    };
    beforeEach(() => {
        vi.clearAllMocks();
        global.alert = mockAlert;
        // Mock API responses
        vi.mocked(apiClient.get).mockResolvedValue({
            data: mockEvent
        });
        vi.mocked(apiClient.patch).mockResolvedValue({
            data: { success: true }
        });
        vi.mocked(apiClient.request).mockResolvedValue({
            data: { success: true }
        });
    });
    const setup = async (useDarkTheme = false) => {
        let renderResult;
        await act(async () => {
            renderResult = render(_jsx(ThemeProvider, { theme: useDarkTheme ? darkTheme : theme, children: _jsx(MemoryRouter, { initialEntries: [`/events/${mockEventId}`], children: _jsx(Routes, { children: _jsx(Route, { path: "/events/:event_id", element: _jsx(ViewEvent, {}) }) }) }) }));
            // Wait for useEffect to complete
            await new Promise(resolve => setTimeout(resolve, 0));
        });
        return renderResult;
    };
    it('renders loading state initially', async () => {
        const originalGet = vi.mocked(apiClient.get);
        vi.mocked(apiClient.get).mockImplementation(() => new Promise(resolve => {
            setTimeout(() => resolve({ data: mockEvent }), 1000);
        }));
        await act(async () => {
            render(_jsx(ThemeProvider, { theme: theme, children: _jsx(MemoryRouter, { initialEntries: [`/events/${mockEventId}`], children: _jsx(Routes, { children: _jsx(Route, { path: "/events/:event_id", element: _jsx(ViewEvent, {}) }) }) }) }));
        });
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
        vi.mocked(apiClient.get).mockImplementation(originalGet);
    });
    it('fetches and displays event data correctly', async () => {
        await setup();
        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
        });
        expect(screen.getByText('View Event Details')).toBeInTheDocument();
        expect(screen.getByLabelText('Event Title')).toHaveValue('Test Event');
        expect(screen.getByLabelText('Description')).toHaveValue('This is a test event');
        expect(screen.getByLabelText('Date')).toHaveValue('2025-12-31');
        expect(screen.getByLabelText('Start Time')).toHaveValue('14:00');
        expect(screen.getByLabelText('Duration')).toHaveValue('2 hours');
        expect(screen.getByLabelText('Location')).toHaveValue('Test Location');
        expect(screen.getByLabelText('Hosted By')).toHaveValue('Test Host');
        expect(apiClient.get).toHaveBeenCalledWith(`/api/admin-events/${mockEventId}`);
    });
    it('handles form changes correctly', async () => {
        await setup();
        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
        });
        const titleInput = screen.getByLabelText('Event Title');
        fireEvent.change(titleInput, { target: { value: 'Updated Event Title' } });
        expect(titleInput).toHaveValue('Updated Event Title');
    });
    it('submits form data correctly', async () => {
        await setup();
        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
        });
        const titleInput = screen.getByLabelText('Event Title');
        fireEvent.change(titleInput, { target: { value: 'Updated Event Title' } });
        const submitButton = screen.getByText('Save Changes');
        await act(async () => {
            fireEvent.click(submitButton);
        });
        await waitFor(() => {
            expect(apiClient.patch).toHaveBeenCalledWith(`/api/admin-manage-event-details/${mockEventId}`, expect.objectContaining({
                title: 'Updated Event Title',
            }));
        });
        expect(mockAlert).toHaveBeenCalledWith('Event updated successfully!');
    });
    it('navigates back when back button is clicked', async () => {
        await setup();
        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
        });
        const backButton = screen.getByText('← Back');
        await act(async () => {
            fireEvent.click(backButton);
        });
        expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
    it('handles API error when updating event', async () => {
        vi.mocked(apiClient.patch).mockRejectedValueOnce(new Error('Failed to update event'));
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        await setup();
        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
        });
        const submitButton = screen.getByText('Save Changes');
        await act(async () => {
            fireEvent.click(submitButton);
        });
        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalled();
            expect(mockAlert).toHaveBeenCalledWith('There was an error updating the event.');
        });
        consoleErrorSpy.mockRestore();
    });
    it('handles API error when fetching event', async () => {
        vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Failed to load event'));
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        await act(async () => {
            render(_jsx(ThemeProvider, { theme: theme, children: _jsx(MemoryRouter, { initialEntries: [`/events/${mockEventId}`], children: _jsx(Routes, { children: _jsx(Route, { path: "/events/:event_id", element: _jsx(ViewEvent, {}) }) }) }) }));
        });
        // Wait for loading to complete, but we should still show the loading state
        // since formData would be null
        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalled();
            expect(screen.getByRole('progressbar')).toBeInTheDocument();
        });
        consoleErrorSpy.mockRestore();
    });
});
