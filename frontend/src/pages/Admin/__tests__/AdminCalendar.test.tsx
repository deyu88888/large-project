// Import vitest and testing library utilities first
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Mocks must come before the components they mock
// Mock the API
vi.mock('../../../api', () => ({
  getAllEvents: vi.fn(),
  apiClient: {
    get: vi.fn()
  }
}));

// Mock the Header component
vi.mock('../../../components/Header', () => ({
  default: function MockHeader({ title, subtitle }) {
    return (
      <div data-testid="mock-header">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
    );
  }
}));

// Mock react-big-calendar
vi.mock('react-big-calendar', () => ({
  Calendar: function MockCalendar({ events, onSelectEvent }) {
    return (
      <div data-testid="mock-calendar">
        {events.map((event) => (
          <div 
            key={event.id} 
            data-testid="calendar-event" 
            onClick={() => onSelectEvent && onSelectEvent(event)}
          >
            {event.title}
          </div>
        ))}
      </div>
    );
  },
  momentLocalizer: vi.fn(() => ({}))
}));

// Mock theme tokens function
vi.mock('../../../theme/theme', () => ({
  tokens: () => ({
    grey: {
      100: '#e0e0e0',
      500: '#9e9e9e',
      700: '#616161',
    },
    primary: {
      400: '#f5f5f5',
    },
    greenAccent: {
      500: '#4caf50',
    },
    redAccent: {
      500: '#f44336',
    },
    blueAccent: {
      500: '#2196f3',
    },
  }),
}));

// IMPORTANT: Import components AFTER all mocks are defined
import AdminCalendar from "../AdminCalendar";
import { getAllEvents } from "../../../api";

// Mock theme
const mockTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#3f51b5',
      light: '#7986cb',
      dark: '#303f9f',
      contrastText: '#fff',
    },
    secondary: {
      main: '#f50057',
      light: '#ff4081',
      dark: '#c51162',
      contrastText: '#fff',
    },
  },
});

// Sample mock event data that matches your API response format
const mockEvents = [
  {
    id: 1,
    title: 'Past Event',
    description: 'This is a past event',
    date: '2023-01-15',
    startTime: '14:00',
    duration: '2 hours',
    hostedBy: 1,
    location: 'Room 101',
  },
  {
    id: 2,
    title: 'Current Event',
    description: 'This is happening now',
    date: new Date().toISOString().split('T')[0], // Today's date
    startTime: '09:00',
    duration: '3 hours',
    hostedBy: 2,
    location: 'Main Hall',
  },
  {
    id: 3,
    title: 'Future Event',
    description: 'This is a future event',
    date: '2025-12-31',
    startTime: '18:00',
    duration: '4 hours',
    hostedBy: 3,
    location: 'Conference Room',
  },
];

describe('AdminCalendar Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.resetAllMocks();
    
    // Mock the API call to return our test data
    vi.mocked(getAllEvents).mockResolvedValue(mockEvents);
  });

  it('should fetch all events when component mounts', async () => {
    render(
      <ThemeProvider theme={mockTheme}>
        <AdminCalendar />
      </ThemeProvider>
    );

    // Check if the API was called exactly once
    expect(getAllEvents).toHaveBeenCalledTimes(1);

    // Wait for events to load and check they're displayed
    await waitFor(() => {
      expect(screen.getAllByTestId('calendar-event').length).toBe(mockEvents.length);
    });
  });

  it('should display all events from the database', async () => {
    render(
      <ThemeProvider theme={mockTheme}>
        <AdminCalendar />
      </ThemeProvider>
    );

    // Wait for events to load
    await waitFor(() => {
      // Check if all event titles are in the document
      expect(screen.getByText('Past Event')).toBeInTheDocument();
      expect(screen.getByText('Current Event')).toBeInTheDocument();
      expect(screen.getByText('Future Event')).toBeInTheDocument();
    });
  });

  it('should display past, present, and future events', async () => {
    render(
      <ThemeProvider theme={mockTheme}>
        <AdminCalendar />
      </ThemeProvider>
    );

    // Wait for events to load
    await waitFor(() => {
      // Check if we have events from different time periods
      const pastEvent = screen.getByText('Past Event');
      const currentEvent = screen.getByText('Current Event');
      const futureEvent = screen.getByText('Future Event');

      expect(pastEvent).toBeInTheDocument();
      expect(currentEvent).toBeInTheDocument();
      expect(futureEvent).toBeInTheDocument();
    });
  });

  it('should show error message when API call fails', async () => {
    // Mock API to throw an error
    vi.mocked(getAllEvents).mockRejectedValue(new Error('Failed to fetch events'));

    render(
      <ThemeProvider theme={mockTheme}>
        <AdminCalendar />
      </ThemeProvider>
    );

    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText(/failed to load events/i)).toBeInTheDocument();
    });
  });

  it('should have a refresh button', async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider theme={mockTheme}>
        <AdminCalendar />
      </ThemeProvider>
    );

    // Wait for initial events to load
    await waitFor(() => {
      expect(screen.getAllByTestId('calendar-event').length).toBe(mockEvents.length);
    });

    // Find the refresh button
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    expect(refreshButton).toBeInTheDocument();
    expect(refreshButton).not.toBeDisabled();
  });
  
  it('should call API twice when rendered twice', async () => {
    // First render
    const { unmount } = render(
      <ThemeProvider theme={mockTheme}>
        <AdminCalendar />
      </ThemeProvider>
    );

    // Wait for initial events to load
    await waitFor(() => {
      expect(screen.getAllByTestId('calendar-event').length).toBe(mockEvents.length);
    });
    
    // API should have been called once
    expect(getAllEvents).toHaveBeenCalledTimes(1);
    
    // Unmount
    unmount();
    
    // Render again (completely new render)
    render(
      <ThemeProvider theme={mockTheme}>
        <AdminCalendar />
      </ThemeProvider>
    );
    
    // Wait for events to load again
    await waitFor(() => {
      expect(screen.getAllByTestId('calendar-event').length).toBe(mockEvents.length);
    });
    
    // API should now have been called twice total
    expect(getAllEvents).toHaveBeenCalledTimes(2);
  });
});