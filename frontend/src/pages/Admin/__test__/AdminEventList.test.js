import { jsx as _jsx } from "react/jsx-runtime";
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import EventList from '../AdminEventList';
import { apiClient } from '../../../api';
import { SearchContext } from '../../../components/layout/SearchContext';
// Mock the WebSocket
class MockWebSocket {
    constructor() {
        Object.defineProperty(this, "onopen", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: vi.fn()
        });
        Object.defineProperty(this, "onmessage", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: vi.fn()
        });
        Object.defineProperty(this, "onerror", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: vi.fn()
        });
        Object.defineProperty(this, "onclose", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: vi.fn()
        });
        Object.defineProperty(this, "send", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: vi.fn()
        });
        Object.defineProperty(this, "close", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: vi.fn()
        });
        setTimeout(() => {
            if (this.onopen)
                this.onopen();
        }, 0);
    }
}
// Create mock themes
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
// Mock API client
vi.mock('../../../api', () => {
    return {
        apiClient: {
            get: vi.fn(),
            request: vi.fn(),
        },
        apiPaths: {
            EVENTS: {
                APPROVEDEVENTLIST: '/api/events/approved'
            },
            USER: {
                DELETE: vi.fn().mockImplementation((type, id) => `/api/${type.toLowerCase()}/${id}/delete`)
            }
        }
    };
});
// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});
// Mock theme tokens
vi.mock('../../../theme/theme', () => {
    return {
        tokens: vi.fn().mockReturnValue({
            blueAccent: {
                500: '#5a84ff',
                700: '#3461ff'
            },
            primary: {
                400: '#f8f9fa'
            },
            greenAccent: {
                200: '#4cceac'
            }
        })
    };
});
// Mock settings store
vi.mock('../../../stores/settings-store', () => {
    return {
        useSettingsStore: vi.fn().mockReturnValue({
            drawer: false
        })
    };
});
// Mock WebSocket
global.WebSocket = MockWebSocket;
describe('EventList Component', () => {
    const mockEvents = [
        {
            id: '1',
            title: 'Test Event 1',
            description: 'Description for test event 1',
            date: '2025-03-20',
            startTime: '14:00',
            duration: '2 hours',
            hostedBy: 'Test Society',
            location: 'Main Hall'
        },
        {
            id: '2',
            title: 'Test Event 2',
            description: 'Description for test event 2',
            date: '2025-03-21',
            startTime: '16:00',
            duration: '1 hour',
            hostedBy: 'Another Society',
            location: 'Room 101'
        }
    ];
    beforeEach(() => {
        vi.clearAllMocks();
        // Default API mock implementations
        apiClient.get.mockResolvedValue({
            data: mockEvents
        });
        apiClient.request.mockResolvedValue({
            data: { success: true }
        });
    });
    const renderEventList = async (searchTerm = '') => {
        let renderResult;
        await act(async () => {
            renderResult = render(_jsx(ThemeProvider, { theme: theme, children: _jsx(SearchContext.Provider, { value: { searchTerm, setSearchTerm: vi.fn() }, children: _jsx(MemoryRouter, { children: _jsx(EventList, {}) }) }) }));
            // Wait for useEffect to complete
            await new Promise(resolve => setTimeout(resolve, 0));
        });
        return renderResult;
    };
    it('renders the component and fetches events', async () => {
        await renderEventList();
        await waitFor(() => {
            expect(apiClient.get).toHaveBeenCalledWith('/api/events/approved');
        });
        // Check if events are displayed
        expect(screen.getByText('Test Event 1')).toBeInTheDocument();
        expect(screen.getByText('Test Event 2')).toBeInTheDocument();
    });
    it('filters events based on search term', async () => {
        await renderEventList('Test Event 1');
        await waitFor(() => {
            expect(screen.getByText('Test Event 1')).toBeInTheDocument();
            expect(screen.queryByText('Test Event 2')).not.toBeInTheDocument();
        });
    });
    it('navigates to event details when View button is clicked', async () => {
        await renderEventList();
        const viewButtons = screen.getAllByText('View');
        await act(async () => {
            fireEvent.click(viewButtons[0]);
        });
        expect(mockNavigate).toHaveBeenCalledWith('/admin/view-event/1');
    });
    it('opens delete dialog when Delete button is clicked', async () => {
        await renderEventList();
        const deleteButtons = screen.getAllByText('Delete');
        await act(async () => {
            fireEvent.click(deleteButtons[0]);
        });
        expect(screen.getByText(/Please confirm that you would like to delete Test Event 1/)).toBeInTheDocument();
        expect(screen.getByText(/You may undo this action in the Activity Log/)).toBeInTheDocument();
    });
    it('closes delete dialog when Cancel button is clicked', async () => {
        await renderEventList();
        const deleteButtons = screen.getAllByText('Delete');
        await act(async () => {
            fireEvent.click(deleteButtons[0]);
        });
        // First verify the dialog is open
        expect(screen.getByText(/Please confirm that you would like to delete/)).toBeInTheDocument();
        const cancelButton = screen.getByText('Cancel');
        await act(async () => {
            fireEvent.click(cancelButton);
        });
        // Use waitFor to give the dialog time to close
        await waitFor(() => {
            // Check for the specific complete text as in the component
            expect(screen.queryByText(/Please confirm that you would like to delete Test Event 1/)).not.toBeInTheDocument();
        });
    });
    it('deletes an event when deletion is confirmed', async () => {
        await renderEventList();
        const deleteButtons = screen.getAllByText('Delete');
        await act(async () => {
            fireEvent.click(deleteButtons[0]);
        });
        const reasonInput = screen.getByLabelText('Reason for Deletion');
        await act(async () => {
            fireEvent.change(reasonInput, { target: { value: 'Test reason' } });
        });
        // Clear the mock to track new calls
        apiClient.get.mockClear();
        const confirmButton = screen.getByText('Confirm');
        await act(async () => {
            fireEvent.click(confirmButton);
        });
        expect(apiClient.request).toHaveBeenCalledWith({
            method: 'DELETE',
            url: '/api/event/1/delete',
            data: { reason: 'Test reason' }
        });
        // Check that fetchEvents was called after deletion
        expect(apiClient.get).toHaveBeenCalled();
    });
    it('handles API error when fetching events', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        apiClient.get.mockRejectedValueOnce(new Error('Failed to fetch events'));
        await renderEventList();
        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching events:', expect.any(Error));
        });
        consoleErrorSpy.mockRestore();
    });
    it('handles API error when deleting an event', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        apiClient.request.mockRejectedValueOnce(new Error('Failed to delete event'));
        await renderEventList();
        const deleteButtons = screen.getAllByText('Delete');
        await act(async () => {
            fireEvent.click(deleteButtons[0]);
        });
        const confirmButton = screen.getByText('Confirm');
        await act(async () => {
            fireEvent.click(confirmButton);
        });
        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error deleting event:', expect.any(Error));
        });
        consoleErrorSpy.mockRestore();
    });
    it('sets up and cleans up WebSocket connection', async () => {
        // Create a mock WebSocket with all necessary methods
        const mockClose = vi.fn();
        const mockWebSocket = {
            onopen: null,
            onmessage: null,
            onerror: null,
            onclose: null,
            send: vi.fn(),
            close: mockClose
        };
        // Replace the global WebSocket constructor with our mock
        const originalWebSocket = global.WebSocket;
        global.WebSocket = vi.fn(() => mockWebSocket);
        // Render the component with our custom renderer
        const { unmount } = await renderEventList();
        // Verify WebSocket was created with the correct URL
        expect(global.WebSocket).toHaveBeenCalledWith('ws://127.0.0.1:8000/ws/admin/event/');
        // Unmount the component to trigger cleanup
        unmount();
        // Wait for any async cleanup
        await waitFor(() => {
            // Check that close was called (or would have been called)
            expect(mockClose).toHaveBeenCalled();
        });
        // Restore the original WebSocket
        global.WebSocket = originalWebSocket;
    });
    it('handles WebSocket onmessage event', async () => {
        const mockWebSocket = new MockWebSocket();
        global.WebSocket = vi.fn().mockImplementation(() => mockWebSocket);
        await renderEventList();
        // Get the onmessage handler
        const ws = global.WebSocket.mock.results[0].value;
        // Reset the API get mock to track new calls
        apiClient.get.mockClear();
        // Simulate receiving a message
        if (ws.onmessage) {
            ws.onmessage({ data: JSON.stringify({ type: 'update' }) });
        }
        // Verify that events were fetched again
        expect(apiClient.get).toHaveBeenCalled();
    });
});
