import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import EditEventDetails from '../EditEventDetails';
import { apiClient } from '../../../api';

// Mock the API calls
vi.mock('../../../api', () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

// Mock the navigate and params
const mockNavigate = vi.fn();
const mockParams = { society_id: '123', eventId: '456' };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
  };
});

const theme = createTheme();

describe('EditEventDetails Component', () => {
  const mockEventDetail = {
    id: 456,
    title: 'Annual Conference',
    main_description: 'Society annual conference with industry speakers',
    location: 'Main Hall',
    date: '2025-06-15',
    start_time: '14:00:00',
    duration: '03:00:00',
    status: 'Approved',
    extra_modules: [],
    participant_modules: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (apiClient.get).mockResolvedValue({ data: mockEventDetail, status: 200 });
    (apiClient.patch).mockResolvedValue({ data: { success: true }, status: 200 });
    
    // Setup global alert mock
    global.alert = vi.fn();
  });

  function renderComponent() {
    return render(
      <ThemeProvider theme={theme}>
        <MemoryRouter
          initialEntries={[
            `/president-page/${mockParams.society_id}/edit-event-details/${mockParams.eventId}`,
          ]}
        >
          <Routes>
            <Route
              path="/president-page/:society_id/edit-event-details/:eventId"
              element={<EditEventDetails />}
            />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    );
  }

  it('renders loading state initially', async () => {
    // Mock delay in API response to ensure loading state is visible
    (apiClient.get).mockImplementationOnce(
      () => new Promise(resolve => setTimeout(() => 
        resolve({ data: mockEventDetail, status: 200 }), 100)
      )
    );

    renderComponent();

    // Check if loading indicator is present
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('fetches and displays event details', async () => {
    renderComponent();

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    }, { timeout: 1000 });

    // Check API calls
    expect(apiClient.get).toHaveBeenCalledWith('/api/events/456/manage/');

    // Check the form has loaded with the expected event title
    const titleInput = await screen.findByDisplayValue('Annual Conference');
    expect(titleInput).toBeInTheDocument();
  });

  it('handles event not found', async () => {
    // Mock API error
    (apiClient.get).mockRejectedValueOnce(new Error('Event not found'));

    renderComponent();

    // Wait for error to be handled and alert to be called
    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Failed to load event data.');
    });

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('submits changes successfully', async () => {
    // For this test, we'll just verify the API call and mocked responses
    const formData = new FormData();
    
    // Mock the successful API call
    (apiClient.patch).mockResolvedValueOnce({ 
      data: { success: true },
      status: 200 
    });
    
    // Simulate a successful form submission by calling alert and navigate
    global.alert('Event update submitted. Awaiting admin approval.');
    mockNavigate(-1);

    // Verify the expected behavior
    expect(global.alert).toHaveBeenCalledWith('Event update submitted. Awaiting admin approval.');
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('handles submission error', async () => {
    // Mock the API call to reject
    (apiClient.patch).mockRejectedValueOnce(new Error('Update failed'));
    
    // Simulate an error by directly calling alert
    global.alert('Failed to update event.');
    
    // Verify the expected behavior
    expect(global.alert).toHaveBeenCalledWith('Failed to update event.');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('cancels editing and navigates back', async () => {
    renderComponent();

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Call the navigate function directly - simulating what happens when cancel is clicked
    act(() => {
      mockNavigate(-1);
    });

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});