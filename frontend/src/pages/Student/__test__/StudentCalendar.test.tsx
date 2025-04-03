import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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
              {event.rsvp && <span data-testid="rsvp-indicator">RSVP</span>}
            </div>
          ))}
        </div>
        {events.length === 0 && <div>No events from your societies</div>}
      </div>
    ),
    momentLocalizer: vi.fn().mockReturnValue({}),
  };
});

// Mock moment-timezone with more complete implementation
vi.mock('moment-timezone', () => {
  const formatFn = (format) => {
    if (format === 'h:mm A') return '10:00 AM';
    if (format === 'dddd, MMMM Do YYYY') return 'Monday, January 1st 2025';
    if (format === 'LT') return '10:00 AM';
    return 'Jan 1, 2025';
  };
  
  const momentObj = {
    format: formatFn,
    toDate: () => new Date(2025, 0, 1),
    pct_change: () => 0,
  };
  
  const moment = vi.fn().mockReturnValue(momentObj);
  moment.tz = vi.fn().mockReturnValue(momentObj);
  
  return { 
    default: moment,
    __esModule: true
  };
});

// Fixed mock date to ensure deterministic test behavior
const mockCurrentDate = new Date(2024, 11, 31); // December 31, 2024
const originalDate = global.Date;

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

// Mock the transformed events - these represent the events after transformation
const mockTransformedEvents = [
  {
    id: 1,
    title: 'Tech Workshop',
    start: new Date(2025, 0, 1, 10, 0),
    end: new Date(2025, 0, 1, 12, 0),
    description: 'Learn new technologies',
    location: 'Room 101',
    societyId: 1,
    societyName: 'Computer Science Society',
    rsvp: false
  },
  {
    id: 2,
    title: 'Chess Tournament',
    start: new Date(2025, 0, 2, 14, 0),
    end: new Date(2025, 0, 2, 17, 0),
    description: 'Annual chess competition',
    location: 'Main Hall',
    societyId: 2,
    societyName: 'Chess Club',
    rsvp: true
  }
];

describe('StudentCalendar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock Date to ensure consistent date checks
    global.Date = class extends Date {
      constructor(...args) {
        if (args.length === 0) {
          return new originalDate(mockCurrentDate);
        }
        return new originalDate(...args);
      }
      static now() {
        return mockCurrentDate.getTime();
      }
    };
    
    // Set default mock responses
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockEvents });
    vi.mocked(apiClient.post).mockResolvedValue({ data: { success: true } });
    vi.mocked(apiClient.delete).mockResolvedValue({ data: { success: true } });
    
    // Mock console.error to prevent error output during tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    // Restore original Date
    global.Date = originalDate;
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
    expect(screen.getByText('Chess Tournament')).toBeInTheDocument();
  });

  it('filters events to only those from user societies', async () => {
    // Include an event from a society the user isn't in
    const eventsWithOtherSociety = [
      ...mockEvents,
      {
        id: 3,
        title: 'Dance Party',
        date: '2025-01-03',
        start_time: '19:00',
        duration: '4 hours',
        description: 'Annual dance',
        location: 'Main Hall',
        hosted_by: 3, // Not in mockSocieties
        societyName: 'Dance Club'
      }
    ];
    
    vi.mocked(apiClient.get).mockResolvedValue({ data: eventsWithOtherSociety });
    
    renderComponent();
    
    // Wait for the calendar to appear
    await waitFor(() => {
      expect(screen.getByTestId('mock-calendar')).toBeInTheDocument();
    });
    
    // Should show events from user's societies
    expect(screen.getByText('Tech Workshop')).toBeInTheDocument();
    expect(screen.getByText('Chess Tournament')).toBeInTheDocument();
    
    // Should not show event from other society
    expect(screen.queryByText('Dance Party')).not.toBeInTheDocument();
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
    
    renderComponent();
    
    // Wait for the error message
    await waitFor(() => {
      expect(screen.getByText('Failed to load events. Please try again.')).toBeInTheDocument();
    });
  });

  it('allows user to close error messages', async () => {
    // Mock API error
    vi.mocked(apiClient.get).mockRejectedValue(new Error('API Error'));
    
    renderComponent();
    
    // Wait for the error message and alert to be visible
    await waitFor(() => {
      expect(screen.getByText('Failed to load events. Please try again.')).toBeInTheDocument();
    });
    
    // Find and click the close button (MUI Alert close button)
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
    
    // Click on an event using its test id to avoid ambiguity
    fireEvent.click(screen.getByTestId('event-1'));
    
    // Dialog should open with event details
    await waitFor(() => {
      // Use more specific queries to avoid ambiguity with duplicate text
      expect(screen.getByText('Learn new technologies')).toBeInTheDocument(); // Description
      expect(screen.getByText('Room 101')).toBeInTheDocument(); // Location
      expect(screen.getByText('RSVP to Event')).toBeInTheDocument(); // RSVP button
      // Check for DialogTitle containing event title (more specific than just the text)
      expect(screen.getByRole('heading', { name: 'Tech Workshop' })).toBeInTheDocument();
    });
  });

  it('shows "You\'re going" chip for RSVPed events', async () => {
    renderComponent();
    
    // Wait for the calendar to appear
    await waitFor(() => {
      expect(screen.getByTestId('mock-calendar')).toBeInTheDocument();
    });
    
    // Click on an RSVPed event
    fireEvent.click(screen.getByText('Chess Tournament'));
    
    // Should show RSVP indicator
    await waitFor(() => {
      expect(screen.getByText('You\'re attending this event')).toBeInTheDocument();
    });
  });

  it('handles RSVP button click correctly', async () => {
    renderComponent();
    
    // Wait for the calendar to appear
    await waitFor(() => {
      expect(screen.getByTestId('mock-calendar')).toBeInTheDocument();
    });
    
    // Click on a non-RSVPed event
    fireEvent.click(screen.getByText('Tech Workshop'));
    
    // Wait for dialog to appear
    await waitFor(() => {
      expect(screen.getByText('RSVP to Event')).toBeInTheDocument();
    });
    
    // Click RSVP button
    fireEvent.click(screen.getByText('RSVP to Event'));
    
    // API should be called
    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/api/events/rsvp/', { event_id: 1 });
    });
  });

  it('handles cancel RSVP button click correctly', async () => {
    renderComponent();
    
    // Wait for the calendar to appear
    await waitFor(() => {
      expect(screen.getByTestId('mock-calendar')).toBeInTheDocument();
    });
    
    // Click on an RSVPed event
    fireEvent.click(screen.getByText('Chess Tournament'));
    
    // Wait for dialog to appear with Cancel button
    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
    
    // Click Cancel RSVP button
    fireEvent.click(screen.getByText('Cancel'));
    
    // API should be called
    await waitFor(() => {
      expect(apiClient.delete).toHaveBeenCalledWith('/api/events/rsvp/', { data: { event_id: 2 } });
    });
  });

  it('disables RSVP button for events that have already started', async () => {
    // Change mock date to be after event start
    const futureDate = new Date(2025, 0, 1, 11, 0); // Jan 1, 2025, 11:00 (after Tech Workshop starts)
    global.Date = class extends Date {
      constructor(...args) {
        if (args.length === 0) {
          return new originalDate(futureDate);
        }
        return new originalDate(...args);
      }
      static now() {
        return futureDate.getTime();
      }
    };
    
    renderComponent();
    
    // Wait for the calendar to appear
    await waitFor(() => {
      expect(screen.getByTestId('mock-calendar')).toBeInTheDocument();
    });
    
    // Click on event that has already started
    fireEvent.click(screen.getByText('Tech Workshop'));
    
    // Should show message that event has already started
    await waitFor(() => {
      expect(screen.getByText('This event has already started')).toBeInTheDocument();
      expect(screen.getByText('You cannot RSVP for an event that has already started')).toBeInTheDocument();
    });
  });

  it('refreshes events when refresh button is clicked', async () => {
    renderComponent();
    
    // Wait for the calendar to appear
    await waitFor(() => {
      expect(screen.getByTestId('mock-calendar')).toBeInTheDocument();
    });
    
    // Clear previous API calls
    vi.mocked(apiClient.get).mockClear();
    
    // Find and click refresh button
    const refreshButton = screen.getByTitle('Refresh events');
    fireEvent.click(refreshButton);
    
    // API should be called again
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/events/all/');
    });
  });
  
  it('handles RSVP API errors correctly', async () => {
    // Mock error response for RSVP attempt
    vi.mocked(apiClient.post).mockRejectedValue({
      response: {
        data: {
          non_field_errors: ['You have already RSVPed to this event.']
        }
      }
    });
    
    renderComponent();
    
    // Wait for the calendar to appear
    await waitFor(() => {
      expect(screen.getByTestId('mock-calendar')).toBeInTheDocument();
    });
    
    // Click on a non-RSVPed event
    fireEvent.click(screen.getByText('Tech Workshop'));
    
    // Wait for dialog to appear
    await waitFor(() => {
      expect(screen.getByText('RSVP to Event')).toBeInTheDocument();
    });
    
    // Click RSVP button
    fireEvent.click(screen.getByText('RSVP to Event'));
    
    // Error message should be displayed
    await waitFor(() => {
      expect(screen.getByText('You have already RSVPed to this event.')).toBeInTheDocument();
    });
  });
});