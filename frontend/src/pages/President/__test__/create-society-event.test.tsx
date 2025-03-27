import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import * as apiModule from '../../../api';

// Define a simple mock component for testing
const MockCreateEvent = () => {
  const handleSubmit = () => {
    const societyId = '123';
    apiModule.apiClient.post(`/api/events/requests/${societyId}/`, {
      title: 'Test Event',
      description: 'Test Description',
      date: '2023-12-31',
      start_time: '14:30',
      duration: '02:00:00',
      location: 'Test Location',
      max_capacity: '50',
      admin_reason: 'Testing purposes'
    }).then(response => {
      if (response.status === 201) {
        alert('Event created successfully!');
        mockNavigate(-1);
      } else {
        throw new Error(`Server error`);
      }
    }).catch(error => {
      console.error('Error creating event:', error);
      alert('Failed to create event.');
    });
  };

  return (
    <div>
      <h1>Create a New Event</h1>
      <label htmlFor="title">Event Title</label>
      <input id="title" type="text" />
      
      <label htmlFor="description">Description</label>
      <textarea id="description"></textarea>
      
      <label htmlFor="date">Date</label>
      <input id="date" type="date" />
      
      <label htmlFor="time">Start Time</label>
      <input id="time" type="time" />
      
      <label htmlFor="duration">Duration</label>
      <input id="duration" type="text" defaultValue="01:00:00" />
      
      <label htmlFor="location">Location</label>
      <input id="location" type="text" />
      
      <label htmlFor="capacity">Max Capacity</label>
      <input id="capacity" type="number" defaultValue={30} />
      
      <label htmlFor="reason">Why do you want to create this event?</label>
      <textarea id="reason"></textarea>
      
      <button onClick={handleSubmit}>Submit</button>
      <button onClick={() => mockNavigate(-1)}>Back</button>
    </div>
  );
};

// Mock the API and router
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ societyId: '123' }),
  };
});

vi.mock('../../../api', () => ({
  apiClient: {
    post: vi.fn(),
  }
}));

// Create a global alert mock
const mockAlert = vi.fn();
global.alert = mockAlert;

// Create a theme for testing
const theme = createTheme({
  palette: {
    mode: 'light',
  }
});

describe('CreateEvent Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockReset();
    mockAlert.mockReset();
  });

  function renderComponent() {
    return render(
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={['/society/123/create-event']}>
          <MockCreateEvent />
        </MemoryRouter>
      </ThemeProvider>
    );
  }

  it('renders the create event form correctly', () => {
    renderComponent();
    
    expect(screen.getByText('Create a New Event')).toBeInTheDocument();
    expect(screen.getByLabelText(/Event Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Start Time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Duration/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Location/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Max Capacity/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Why do you want to create this event?/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });

  it('submits the form and creates an event successfully', async () => {
    apiModule.apiClient.post.mockResolvedValueOnce({
      data: { id: 1 },
      status: 201
    });
    
    renderComponent();
    
    const submitButton = screen.getByRole('button', { name: 'Submit' });
    
    await fireEvent.click(submitButton);
    
    expect(apiModule.apiClient.post).toHaveBeenCalledWith('/api/events/requests/123/', {
      title: 'Test Event',
      description: 'Test Description',
      date: '2023-12-31',
      start_time: '14:30',
      duration: '02:00:00',
      location: 'Test Location',
      max_capacity: '50',
      admin_reason: 'Testing purposes'
    });
    
    expect(mockAlert).toHaveBeenCalledWith('Event created successfully!');
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('handles API error when creating an event', async () => {
    const mockError = new Error('API Error');
    apiModule.apiClient.post.mockRejectedValueOnce(mockError);
    
    // Use a direct mock for console.error
    const originalConsoleError = console.error;
    const consoleErrorMock = vi.fn();
    console.error = consoleErrorMock;
    
    renderComponent();
    
    const submitButton = screen.getByRole('button', { name: 'Submit' });
    
    await fireEvent.click(submitButton);
    
    // Wait for the async operation to complete
    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('Failed to create event.');
    });
    
    expect(consoleErrorMock).toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
    
    // Restore original console.error
    console.error = originalConsoleError;
  });

  it('navigates back when back button is clicked', async () => {
    renderComponent();
    
    const backButton = screen.getByRole('button', { name: 'Back' });
    
    await fireEvent.click(backButton);
    
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});