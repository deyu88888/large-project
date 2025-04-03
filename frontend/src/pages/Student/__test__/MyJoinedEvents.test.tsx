import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import MyJoinedEvents from '../MyJoinedEvents';
import { apiClient } from '../../../api';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../../api', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

vi.mock('../../../components/EventCard', () => ({
  default: vi.fn(({ event, onViewEvent }) => (
    <div data-testid={`event-card-${event.eventId}`} className="event-card">
      <h3>{event.title}</h3>
      <p>Date: {event.date}</p>
      <p>Location: {event.location}</p>
      <button onClick={() => onViewEvent(event.eventId)}>View Event</button>
    </div>
  )),
}));

const mockEvents = [
  {
    id: 1,
    title: 'Tech Conference',
    date: '2025-05-15',
    location: 'Campus Main Hall',
    current_attendees: [{ id: 1, name: 'John Doe' }],
  },
  {
    id: 2,
    title: 'Hackathon',
    date: '2025-06-20',
    location: 'Engineering Building',
    current_attendees: [{ id: 2, name: 'Jane Smith' }],
  },
];

describe('MyJoinedEvents Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    mockNavigate.mockReset();
  });

  const renderComponent = async (themeMode = 'light') => {
    const customTheme = createTheme({
      palette: { mode: themeMode === 'light' ? 'light' : 'dark' },
    });
    await act(async () => {
      render(
        <ThemeProvider theme={customTheme}>
          <MemoryRouter>
            <MyJoinedEvents />
          </MemoryRouter>
        </ThemeProvider>
      );
    });
  };

  it('displays loading state initially', async () => {
    vi.mocked(apiClient.get).mockImplementation(() => new Promise(() => {}));
    await renderComponent();
    expect(screen.getByText('Loading events...')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays empty state when no events are returned', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] });
    await renderComponent();
    await waitFor(() => {
      expect(screen.getByText("You haven't joined any events yet.")).toBeInTheDocument();
    });
    expect(screen.queryByText('Loading events...')).not.toBeInTheDocument();
    expect(screen.queryByTestId(/event-card-/)).not.toBeInTheDocument();
  });

  it('displays events when they are fetched successfully', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockEvents });
    await renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Tech Conference')).toBeInTheDocument();
      expect(screen.getByText('Hackathon')).toBeInTheDocument();
    });
    expect(screen.getByTestId('event-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('event-card-2')).toBeInTheDocument();
    expect(screen.queryByText('Loading events...')).not.toBeInTheDocument();
  });

  it('navigates to event detail page when event is clicked', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockEvents });
    await renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Tech Conference')).toBeInTheDocument();
    });
    screen.getAllByText('View Event')[0].click();
    expect(mockNavigate).toHaveBeenCalledWith('/student/event/1');
  });

  it('renders header with correct text', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockEvents });
    await renderComponent();
    await waitFor(() => {
      expect(screen.getByText('My Events')).toBeInTheDocument();
      expect(screen.getByText("Events you've RSVP'd to")).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('API Error'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await renderComponent();
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching joined events:', expect.any(Error));
      expect(screen.getByText("You haven't joined any events yet.")).toBeInTheDocument();
    });
    consoleErrorSpy.mockRestore();
  });

  it('renders with dark theme correctly', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockEvents });
    await renderComponent('dark');
    await waitFor(() => {
      expect(screen.getByText('My Events')).toBeInTheDocument();
    });
  });
});
