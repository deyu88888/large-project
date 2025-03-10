import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ManageSocietyEvents from '../manage-society-events';
import { apiClient } from '../../../api';


const mockNavigate = vi.fn();
const mockParams = { society_id: '123', filter: 'upcoming' };
const mockLocation = { 
  pathname: '/president-page/123/manage-society-events/upcoming',
  search: '',
  hash: '',
  state: null,
  key: 'default'
};


vi.mock('../../../api', () => ({
  apiClient: {
    get: vi.fn(),
    delete: vi.fn(),
  },
}));


vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
    useLocation: () => mockLocation,
  };
});


global.confirm = vi.fn(() => true);
global.alert = vi.fn();


const theme = createTheme();

describe('ManageSocietyEvents Component', () => {
  
  const mockEvents = [
    {
      id: 1,
      title: 'Annual Meetup',
      date: '2025-06-15', 
      start_time: '14:00',
      status: 'Approved',
      hosted_by: 123, 
      description: 'Annual society gathering',
      location: 'Main Hall',
      duration: '2 hours',
      max_capacity: 100,
      current_attendees: [1, 2, 3]
    },
    {
      id: 2,
      title: 'Workshop',
      date: '2023-05-20', 
      start_time: '10:00',
      status: 'Approved',
      hosted_by: 123,
      description: 'Programming workshop',
      location: 'Computer Lab',
      duration: '3 hours',
      max_capacity: 30,
      current_attendees: [4, 5]
    },
    {
      id: 3,
      title: 'Pending Event',
      date: '2025-07-10',
      start_time: '15:30',
      status: 'Pending',
      hosted_by: 123,
      description: 'New event waiting approval',
      location: 'Conference Room',
      duration: '1 hour',
      max_capacity: 50,
      current_attendees: []
    }
  ];

  beforeEach(() => {
    
    vi.clearAllMocks();

    
    mockParams.society_id = '123';
    mockParams.filter = 'upcoming';
    mockLocation.pathname = '/president-page/123/manage-society-events/upcoming';

   
    (apiClient.get).mockResolvedValue({
      data: mockEvents
    });
  });

  const renderComponent = async (societyId = '123', filter = 'upcoming') => {
   
    mockParams.society_id = societyId;
    mockParams.filter = filter;
    mockLocation.pathname = `/president-page/${societyId}/manage-society-events/${filter}`;
    
    let component;
    
    await act(async () => {
      component = render(
        <ThemeProvider theme={theme}>
          <MemoryRouter initialEntries={[`/president-page/${societyId}/manage-society-events/${filter}`]}>
            <Routes>
              <Route 
                path="/president-page/:society_id/manage-society-events/:filter" 
                element={<ManageSocietyEvents />} 
              />
            </Routes>
          </MemoryRouter>
        </ThemeProvider>
      );
      
      
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    return component;
  };

  it('renders page title and initial loading state', async () => {
    await renderComponent();

    expect(screen.getByText('Manage Society Events')).toBeInTheDocument();
    
    expect(screen.getByText('Upcoming events for Society 123')).toBeInTheDocument();
  });

  it('renders loading spinner while fetching events', async () => {
    
    (apiClient.get).mockImplementationOnce(() => new Promise(() => {}));
    
    await renderComponent();
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('fetches and displays events successfully', async () => {
    await renderComponent();

   
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

   
    expect(screen.getByText('Annual Meetup')).toBeInTheDocument();
    
    
    expect(screen.queryByText('Workshop')).not.toBeInTheDocument();
    expect(screen.queryByText('Pending Event')).not.toBeInTheDocument();

    
    expect(apiClient.get).toHaveBeenCalledWith('/api/events/', {
      params: { society_id: 123 } 
    });
  });

  it('handles empty events list', async () => {
    (apiClient.get).mockResolvedValueOnce({ data: [] });

    await renderComponent();

    await waitFor(() => {
      
      expect(screen.getByText('No upcoming events found for society 123.')).toBeInTheDocument();
    });
  });

  it('handles API error', async () => {
    const errorMessage = 'Fetch failed';
    (apiClient.get).mockRejectedValueOnce(new Error(errorMessage));

    await renderComponent();

    await waitFor(() => {
      
      expect(screen.getByText('Failed to load upcoming events: Fetch failed')).toBeInTheDocument();
    });
  });

  it('navigates to create event page', async () => {
    await renderComponent();

    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    const createEventButton = screen.getByText('Create a New Event');
    await act(async () => {
      fireEvent.click(createEventButton);
    });

    expect(mockNavigate).toHaveBeenCalledWith('/president-page/123/create-society-event/');
  });

  it('changes filter and updates events displayed', async () => {
    await renderComponent();

    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    
    expect(screen.getByText('Annual Meetup')).toBeInTheDocument();
    
    
    mockParams.filter = 'previous';
    
    
    const previousButton = screen.getByRole('button', { name: 'Previous' });
    await act(async () => {
      fireEvent.click(previousButton);
    });

    
    await waitFor(() => {
      
      expect(screen.getByText('Workshop')).toBeInTheDocument();
    });
    
    
    expect(screen.queryByText('Annual Meetup')).not.toBeInTheDocument();
  });

  it('displays pending events when Pending Approval filter is selected', async () => {
    await renderComponent();

    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    
    mockParams.filter = 'pending';
    
   
    const pendingButton = screen.getByRole('button', { name: 'Pending Approval' });
    await act(async () => {
      fireEvent.click(pendingButton);
    });

   
    await waitFor(() => {
      
      expect(screen.getByText('Pending Event')).toBeInTheDocument();
    });
    
    
    expect(screen.queryByText('Annual Meetup')).not.toBeInTheDocument();
  });
  
  it('allows deleting an event', async () => {
    
    (apiClient.delete).mockResolvedValueOnce({ success: true });
    
    await renderComponent('123', 'pending');
    
   
    await waitFor(() => {
      expect(screen.getByText('Pending Event')).toBeInTheDocument();
    });
    
   
    const deleteButton = screen.getByText('Delete');
    await act(async () => {
      fireEvent.click(deleteButton);
    });
    
    
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this event?');
    expect(apiClient.delete).toHaveBeenCalledWith('/api/events/3/');
    expect(window.alert).toHaveBeenCalledWith('Event deleted successfully.');
  });

  // NEW TEST: Test for delete failure case (lines 146-148)
  it('handles error when deleting an event fails', async () => {
    // Mock the delete API to reject with an error
    const deleteError = new Error('Network error');
    (apiClient.delete).mockRejectedValueOnce(deleteError);
    
    await renderComponent('123', 'pending');
    
    await waitFor(() => {
      expect(screen.getByText('Pending Event')).toBeInTheDocument();
    });
    
    const deleteButton = screen.getByText('Delete');
    await act(async () => {
      fireEvent.click(deleteButton);
    });
    
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this event?');
    expect(apiClient.delete).toHaveBeenCalledWith('/api/events/3/');
    
    // Verify the error alert was shown
    expect(window.alert).toHaveBeenCalledWith('Failed to delete event.');
  });

  // NEW TEST: Test for edit event functionality (lines 154-155)
  it('navigates to edit event page when edit button is clicked', async () => {
    await renderComponent('123', 'pending');
    
    await waitFor(() => {
      expect(screen.getByText('Pending Event')).toBeInTheDocument();
    });
    
    const editButton = screen.getByText('Edit');
    await act(async () => {
      fireEvent.click(editButton);
    });
    
    expect(mockNavigate).toHaveBeenCalledWith('/president-page/123/edit-event-details/3');
  });

  // NEW TEST: Test navigation when filter doesn't match filterParam (lines 67-68)
  it('navigates to correct URL when filter is different from filterParam', async () => {
    // Set up with a different filter in state than in URL params
    mockParams.filter = 'upcoming';
    
    await renderComponent();
    
    // Wait for the initial render to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Now manually trigger the effect with a different filter state
    const pendingButton = screen.getByRole('button', { name: 'Pending Approval' });
    
    // Change the state but keep the param the same
    await act(async () => {
      fireEvent.click(pendingButton);
    });

    // Verify the navigate was called with replace: true
    expect(mockNavigate).toHaveBeenCalledWith(
      '/president-page/123/manage-society-events/pending', 
      { replace: true }
    );
  });

  // NEW TEST: Test invalid society ID (lines 74-77)
  it('handles invalid society ID', async () => {
    // Render with an invalid society ID (like non-numeric)
    mockParams.society_id = 'invalid';
    
    await renderComponent('invalid', 'upcoming');
    
    await waitFor(() => {
      expect(screen.getByText('Invalid society ID')).toBeInTheDocument();
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Verify API was not called
    expect(apiClient.get).not.toHaveBeenCalled();
  });
});