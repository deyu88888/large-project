import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ManageSocietyEvents from '../manage-society-events';
import { apiClient } from '../../../api';

// Create a mock navigate function
const mockNavigate = vi.fn();

// Mock dependencies
vi.mock('../../../api', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Create a mock theme
const theme = createTheme();

describe('ManageSocietyEvents Component', () => {
  const mockEvents = [
    {
      id: 1,
      title: 'Annual Meetup',
      date: '2024-06-15',
      start_time: '14:00',
      status: 'upcoming'
    },
    {
      id: 2,
      title: 'Workshop',
      date: '2024-05-20',
      start_time: '10:00',
      status: 'previous'
    }
  ];

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock API client
    (apiClient.get).mockResolvedValue({
      data: mockEvents
    });
  });

  const renderComponent = (societyId = '123') => {
    return render(
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={[`/president-page/${societyId}/events`]}>
          <Routes>
            <Route 
              path="/president-page/:society_id/events" 
              element={<ManageSocietyEvents />} 
            />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    );
  };

  it('renders page title and initial loading state', async () => {
    renderComponent();

    expect(screen.getByText('Manage Society Events')).toBeInTheDocument();
    expect(screen.getByText('Upcoming events for Society 123')).toBeInTheDocument();
  });

  it('renders loading spinner while fetching events', async () => {
    renderComponent();

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('fetches and displays events successfully', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Annual Meetup')).toBeInTheDocument();
      expect(screen.getByText('Workshop')).toBeInTheDocument();
    });

    expect(apiClient.get).toHaveBeenCalledWith('/api/events/', {
      params: { society_id: '123', filter: 'upcoming' }
    });
  });

  it('handles empty events list', async () => {
    (apiClient.get).mockResolvedValueOnce({ data: [] });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('No events found for "upcoming".')).toBeInTheDocument();
    });
  });

  it('handles API error', async () => {
    (apiClient.get).mockRejectedValueOnce(new Error('Fetch failed'));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Failed to load events.')).toBeInTheDocument();
    });
  });

  it('navigates to create event page', async () => {
    renderComponent();

    const createEventButton = screen.getByText('Create a New Event');
    fireEvent.click(createEventButton);

    expect(mockNavigate).toHaveBeenCalledWith('/president-page/123/create-society-event/');
  });

  it('changes filter and refetches events', async () => {
    renderComponent();

    // Wait for initial events to load
    await waitFor(() => {
      expect(screen.getByText('Annual Meetup')).toBeInTheDocument();
    });

    // Click on "Previous" filter
    const previousButton = screen.getByText('Previous');
    fireEvent.click(previousButton);

    // Verify API call with new filter
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/events/', {
        params: { society_id: '123', filter: 'previous' }
      });
    });
  });

  it('renders different filter labels', async () => {
    renderComponent();

    // Check all filter buttons are present
    expect(screen.getByText('Upcoming')).toBeInTheDocument();
    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Pending Approval')).toBeInTheDocument();
  });
});