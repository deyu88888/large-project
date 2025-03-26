import { jsx as _jsx } from "react/jsx-runtime";
import { render, screen, waitFor, act } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import EventListRejected from '../RejectedEventsList';
import { apiClient } from '../../../api';
import { SearchContext } from '../../../components/layout/SearchContext';
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
    },
    apiPaths: {
        EVENTS: {
            REJECTEDEVENTLIST: '/api/events/rejected'
        }
    }
}));
// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});
// Mock the settings store
vi.mock('../../../stores/settings-store', () => ({
    useSettingsStore: vi.fn(() => ({
        drawer: false
    }))
}));
// Mock the tokens function
vi.mock('../../../theme/theme', () => ({
    tokens: vi.fn(() => ({
        blueAccent: {
            500: '#1976d2',
            700: '#1565c0'
        },
        greenAccent: {
            200: '#81c784'
        },
        primary: {
            400: '#f5f5f5'
        }
    }))
}));
// Mock the WebSocket
class MockWebSocket {
    constructor() {
        setTimeout(() => {
            this.onopen && this.onopen();
        }, 0);
    }
    close() { }
}
global.WebSocket = MockWebSocket;
describe('EventListRejected Component', () => {
    const mockEvents = [
        {
            id: 1,
            title: 'Canceled Workshop',
            description: 'Workshop that was rejected',
            date: '2025-04-10',
            startTime: '10:00',
            duration: '2 hours',
            hostedBy: 'Computer Science Society',
            location: 'Building A, Room 101'
        },
        {
            id: 2,
            title: 'Rejected Conference',
            description: 'Conference that was rejected',
            date: '2025-04-15',
            startTime: '09:00',
            duration: '8 hours',
            hostedBy: 'Engineering Society',
            location: 'Main Hall'
        }
    ];
    // Console spy to prevent errors from showing in test output
    let consoleErrorSpy;
    beforeEach(() => {
        vi.clearAllMocks();
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        vi.spyOn(console, 'log').mockImplementation(() => { });
        // Mock the API response
        apiClient.get.mockResolvedValue({
            data: mockEvents
        });
    });
    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });
    const setup = async (searchTerm = '', useDarkTheme = false) => {
        let renderResult;
        await act(async () => {
            renderResult = render(_jsx(SearchContext.Provider, { value: { searchTerm, setSearchTerm: vi.fn() }, children: _jsx(ThemeProvider, { theme: useDarkTheme ? darkTheme : theme, children: _jsx(MemoryRouter, { initialEntries: ['/admin/event-list-rejected'], children: _jsx(Routes, { children: _jsx(Route, { path: "/admin/event-list-rejected", element: _jsx(EventListRejected, {}) }) }) }) }) }));
            // Allow for the effects to run
            await new Promise(resolve => setTimeout(resolve, 0));
        });
        return renderResult;
    };
    it('renders the data grid with rejected events', async () => {
        await setup();
        await waitFor(() => {
            expect(apiClient.get).toHaveBeenCalledWith('/api/events/rejected');
        });
        // Check if events are displayed
        await waitFor(() => {
            expect(screen.getByText('Canceled Workshop')).toBeInTheDocument();
            expect(screen.getByText('Rejected Conference')).toBeInTheDocument();
        });
    });
    it('filters events based on search term', async () => {
        await setup('conference');
        await waitFor(() => {
            expect(screen.queryByText('Canceled Workshop')).not.toBeInTheDocument();
            expect(screen.getByText('Rejected Conference')).toBeInTheDocument();
        });
    });
    it('handles API fetch error gracefully', async () => {
        apiClient.get.mockRejectedValueOnce(new Error('Failed to fetch events'));
        await setup();
        await waitFor(() => {
            expect(apiClient.get).toHaveBeenCalledWith('/api/events/rejected');
        });
        // Verify error was logged
        expect(consoleErrorSpy).toHaveBeenCalled();
    });
    it('renders correctly with dark theme', async () => {
        await setup('', true);
        await waitFor(() => {
            expect(apiClient.get).toHaveBeenCalledWith('/api/events/rejected');
        });
        // Check if events are displayed in dark theme
        await waitFor(() => {
            expect(screen.getByText('Canceled Workshop')).toBeInTheDocument();
            expect(screen.getByText('Rejected Conference')).toBeInTheDocument();
        });
    });
    it('initializes and handles WebSocket connection', async () => {
        const mockWsInstance = {
            onopen: null,
            onmessage: null,
            onerror: null,
            onclose: null,
            close: vi.fn()
        };
        global.WebSocket = vi.fn(() => mockWsInstance);
        await setup();
        // Verify WebSocket was initialized
        expect(global.WebSocket).toHaveBeenCalledWith('ws://127.0.0.1:8000/ws/admin/event/');
        // Simulate receiving a message
        await act(async () => {
            mockWsInstance.onmessage({ data: JSON.stringify({ type: 'update' }) });
        });
        // Verify that fetchEvents was called again
        expect(apiClient.get).toHaveBeenCalledTimes(2);
        // Simulate WebSocket error
        await act(async () => {
            mockWsInstance.onerror(new Event('error'));
        });
        // Simulate WebSocket close
        await act(async () => {
            mockWsInstance.onclose({ reason: 'test close' });
        });
        // Clean up WebSocket mock
        global.WebSocket = MockWebSocket;
    });
    it('handles malformed WebSocket message gracefully', async () => {
        const mockWsInstance = {
            onopen: null,
            onmessage: null,
            onerror: null,
            onclose: null,
            close: vi.fn()
        };
        global.WebSocket = vi.fn(() => mockWsInstance);
        await setup();
        // Simulate receiving a malformed message
        await act(async () => {
            mockWsInstance.onmessage({ data: 'not-json' });
        });
        // Verify error was logged
        expect(consoleErrorSpy).toHaveBeenCalled();
        // Clean up WebSocket mock
        global.WebSocket = MockWebSocket;
    });
});
