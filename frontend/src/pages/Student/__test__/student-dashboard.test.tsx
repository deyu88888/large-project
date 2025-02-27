// StudentDashboard.test.tsx
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import StudentDashboard from './StudentDashboard';
import { apiClient } from '../api';

// ----- Mocks ----- //

// Mock the apiClient so that fetchData returns fake data
vi.mock('../api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock the auth store to provide a fake user
vi.mock('../stores/auth-store', () => ({
  useAuthStore: () => ({
    user: { id: 1, is_president: false },
  }),
}));

// Prepare a mock for react-router-dom's useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  // Import the original module to keep other functionalities intact
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// ----- End Mocks ----- //

const theme = createTheme();

describe('StudentDashboard', () => {
  beforeEach(() => {
    // Reset all mocks before each test run
    vi.clearAllMocks();

    // Provide fake API responses based on the URL
    (apiClient.get as vi.Mock).mockImplementation((url: string) => {
      if (url === '/api/student-societies') {
        return Promise.resolve({
          data: [{ id: 1, name: 'Science Club', is_president: false }],
        });
      }
      if (url === '/api/events/rsvp') {
        return Promise.resolve({
          data: [
            {
              id: 1,
              title: 'Math Workshop',
              date: '2023-09-01',
              rsvp: false,
            },
          ],
        });
      }
      if (url === '/api/notifications') {
        return Promise.resolve({
          data: [{ id: 1, message: 'Test notification', is_read: false }],
        });
      }
      if (url === '/api/award-students/1') {
        return Promise.resolve({
          data: {
            id: 1,
            award: {
              title: 'Excellence Award',
              description: 'Award description',
              rank: 'Gold',
            },
          },
        });
      }
      return Promise.resolve({ data: [] });
    });

    // Spy on localStorage.removeItem to verify logout behavior
    vi.spyOn(window.localStorage.__proto__, 'removeItem').mockImplementation(() => {});
  });

  // Helper function to render the component wrapped in necessary providers
  const renderComponent = () =>
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <StudentDashboard />
        </MemoryRouter>
      </ThemeProvider>
    );

  it('displays a loading spinner initially and then renders the dashboard', async () => {
    renderComponent();

    // Check that the CircularProgress (loading spinner) is in the document
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // Wait for the dashboard header to appear after loading is complete
    await waitFor(() => expect(screen.getByText(/Dashboard/i)).toBeInTheDocument());

    // Verify that the stat cards are rendered
    expect(screen.getByText(/My Societies/i)).toBeInTheDocument();
    expect(screen.getByText(/Upcoming Events/i)).toBeInTheDocument();
    expect(screen.getByText(/Unread Notifications/i)).toBeInTheDocument();
  });

  it('renders fetched data correctly and allows tab switching', async () => {
    renderComponent();

    // Wait until the main dashboard is rendered
    await waitFor(() => expect(screen.getByText(/Dashboard/i)).toBeInTheDocument());

    // --- Societies Tab (default) ---
    // The society name from the API should appear in the Societies tab.
    expect(screen.getByText('Science Club')).toBeInTheDocument();

    // --- Switch to Events Tab ---
    fireEvent.click(screen.getByText('Events'));
    await waitFor(() => expect(screen.getByText('Math Workshop')).toBeInTheDocument());

    // --- Switch to Notifications Tab ---
    fireEvent.click(screen.getByText('Notifications'));
    await waitFor(() => expect(screen.getByText('Test notification')).toBeInTheDocument());

    // --- Achievements Section ---
    // The award title should be rendered in the Achievements section.
    expect(screen.getByText('Excellence Award')).toBeInTheDocument();
  });

  it('calls logout (clears storage and navigates) when logout button is clicked', async () => {
    renderComponent();

    // Wait until the dashboard loads
    await waitFor(() => expect(screen.getByText(/Dashboard/i)).toBeInTheDocument());

    // Find and click the Logout button
    const logoutButton = screen.getByRole('button', { name: /Logout/i });
    fireEvent.click(logoutButton);

    // Verify that localStorage.removeItem is called for both 'access' and 'refresh'
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('access');
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('refresh');

    // Verify that navigate was called with the root path ("/")
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  // Additional tests (e.g., for joining/leaving societies, RSVP, marking notifications as read)
  // can be added here by simulating clicks and verifying the respective API calls.
});
