import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import StudentCalendar from '../StudentCalendar';
import { apiClient } from '../../../api';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Mock dependencies
vi.mock('../../../api', () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: { success: true } }),
    delete: vi.fn().mockResolvedValue({ data: { success: true } }),
  },
}));

// Mock react-big-calendar with a simpler implementation
vi.mock('react-big-calendar', () => {
  return {
    Calendar: ({ events, onSelectEvent }) => (
      <div data-testid="mock-calendar">
        <div data-testid="calendar-events">
          {events.map((event) => (
            <div 
              key={event.id}
              data-testid={`event-${event.id}`}
              onClick={() => onSelectEvent(event)}
            >
              {event.title}
              {event.rsvp && <span>RSVP</span>}
            </div>
          ))}
        </div>
        {events.length === 0 && <div>No events from your societies</div>}
      </div>
    ),
    momentLocalizer: vi.fn().mockReturnValue({}),
  };
});

// Simple mock for moment-timezone
vi.mock('moment-timezone', () => {
  const formatFn = (format) => {
    if (format === 'h:mm A') return '10:00 AM';
    if (format === 'dddd, MMMM Do YYYY') return 'Monday, January 1st 2025';
    return 'Jan 1, 2025';
  };
  
  const momentObj = {
    format: formatFn,
    toDate: () => new Date(2025, 0, 1),
  };
  
  const moment = vi.fn().mockReturnValue(momentObj);
  moment.tz = vi.fn().mockReturnValue(momentObj);
  
  return { default: moment };
});

// Mock data
const mockSocieties = [
  { id: 1, name: 'Computer Science Society' },
  { id: 2, name: 'Chess Club' },
];

const mockEvents = [
  {
    id: 1,
    title: 'Tech Workshop',
    date: '2025-01-01',
    start_time: '10:00',
    duration: '2 hours',
    description: 'Learn new technologies',
    location: 'Room 101',
    hosted_by: 1,
    societyName: 'Computer Science Society',
    rsvp: false
  },
  {
    id: 2,
    title: 'Chess Tournament',
    date: '2025-01-02',
    start_time: '14:00',
    duration: '3 hours',
    description: 'Annual chess competition',
    location: 'Main Hall',
    hosted_by: 2,
    societyName: 'Chess Club',
    rsvp: true
  }
];

describe('StudentCalendar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set default mock responses
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockEvents });
    vi.mocked(apiClient.post).mockResolvedValue({ data: { success: true } });
    vi.mocked(apiClient.delete).mockResolvedValue({ data: { success: true } });
  });

  const renderComponent = (props = {}) => {
    const theme = createTheme({
      palette: {
        mode: 'dark',
      },
    });

    const defaultProps = {
      societies: mockSocieties,
      timezone: 'America/New_York',
      ...props
    };

    return render(
      <ThemeProvider theme={theme}>
        <StudentCalendar {...defaultProps} />
      </ThemeProvider>
    );
  };

  it('displays loading state initially', () => {
    // Don't mock the resolved value here to keep the component loading
    vi.mocked(apiClient.get).mockImplementation(() => 
      new Promise(() => {}) // Never resolves
    );
    
    renderComponent();
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('fetches events from API when userEvents is not provided', async () => {
    renderComponent();
    
    // Wait for the API call to be made
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/events/all/');
    });
  });

  it('displays events when they are fetched successfully', async () => {
    renderComponent();
    
    // Wait for the calendar to appear
    await waitFor(() => {
      expect(screen.getByTestId('mock-calendar')).toBeInTheDocument();
    });
    
    // Check that events are displayed
    expect(screen.getByText('Tech Workshop')).toBeInTheDocument();
    expect(screen.getByText('Chess Tournament')).toBeInTheDocument();
  });

  it('uses provided userEvents instead of fetching from API', async () => {
    renderComponent({ userEvents: mockEvents });
    
    // Wait for the calendar to appear
    await waitFor(() => {
      expect(screen.getByTestId('mock-calendar')).toBeInTheDocument();
    });
    
    // API should not be called
    expect(apiClient.get).not.toHaveBeenCalled();
    
    // Events should be displayed
    expect(screen.getByText('Tech Workshop')).toBeInTheDocument();
  });

  it('shows empty state when no events are available', async () => {
    // Mock empty events response
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] });
    
    renderComponent();
    
    // Wait for the message to appear
    await waitFor(() => {
      expect(screen.getByText('No events from your societies')).toBeInTheDocument();
    });
  });

  it('displays timezone information', async () => {
    renderComponent({ timezone: 'Europe/London' });
    
    // Wait for the calendar to appear
    await waitFor(() => {
      expect(screen.getByTestId('mock-calendar')).toBeInTheDocument();
    });
    
    // Check timezone is displayed
    expect(screen.getByText('Timezone: Europe/London')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    // Mock API error
    vi.mocked(apiClient.get).mockRejectedValue(new Error('API Error'));
    
    // Suppress console errors
    vi.spyOn(console, 'error').mockImplementation(() => {});
    
    renderComponent();
    
    // Wait for the error message
    await waitFor(() => {
      expect(screen.getByText('Failed to load events. Please try again.')).toBeInTheDocument();
    });
  });

  it('allows user to close error messages', async () => {
    // Mock API error
    vi.mocked(apiClient.get).mockRejectedValue(new Error('API Error'));
    
    // Suppress console errors
    vi.spyOn(console, 'error').mockImplementation(() => {});
    
    renderComponent();
    
    // Wait for the error message
    await waitFor(() => {
      expect(screen.getByText('Failed to load events. Please try again.')).toBeInTheDocument();
    });
    
    // Find and click the close button
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    // Error should be cleared
    expect(screen.queryByText('Failed to load events. Please try again.')).not.toBeInTheDocument();
  });

  it('opens event dialog when event is clicked', async () => {
    renderComponent();
    
    // Wait for the calendar to appear
    await waitFor(() => {
      expect(screen.getByTestId('mock-calendar')).toBeInTheDocument();
    });
    
    // Click on an event
    fireEvent.click(screen.getByText('Tech Workshop'));
    
    // Dialog should open with event details
    await waitFor(() => {
      expect(screen.getByText('Monday, January 1st 2025')).toBeInTheDocument();
      expect(screen.getByText('Room 101')).toBeInTheDocument();
      expect(screen.getByText('RSVP to Event')).toBeInTheDocument();
    });
  });

  it('shows RSVP button for non-RSVPed events', async () => {
    renderComponent();
    
    // Wait for the calendar to appear
    await waitFor(() => {
      expect(screen.getByTestId('mock-calendar')).toBeInTheDocument();
    });
    
    // Click on a non-RSVPed event
    fireEvent.click(screen.getByText('Tech Workshop'));
    
    // Should show RSVP button
    await waitFor(() => {
      expect(screen.getByText('RSVP to Event')).toBeInTheDocument();
    });
  });

  it('shows Cancel RSVP button for RSVPed events', async () => {
    renderComponent();
    
    // Wait for the calendar to appear
    await waitFor(() => {
      expect(screen.getByTestId('mock-calendar')).toBeInTheDocument();
    });
    
    // Click on an RSVPed event
    fireEvent.click(screen.getByText('Chess Tournament'));
    
    // Should show Cancel RSVP button
    await waitFor(() => {
      expect(screen.getByText('Cancel RSVP')).toBeInTheDocument();
    });
  });
});