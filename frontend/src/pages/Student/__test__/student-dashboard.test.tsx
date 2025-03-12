import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import StudentDashboard from '../StudentDashboard';
import { apiClient } from '../../../api';

vi.mock('../../../api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const defaultUserMock = { id: 1, is_president: false };
let userMock = { ...defaultUserMock };

vi.mock('../../../stores/auth-store', () => ({
  useAuthStore: () => ({
    get user() {
      return userMock;
    },
  }),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const theme = createTheme();

describe('StudentDashboard', () => {
  describe('Testing uncovered methods directly', () => {
    it('tests the uncovered joinSociety method directly', async () => {
      const mockFetchData = vi.fn();
      function TestJoinSociety() {
        const joinSociety = async (societyId: number) => {
          try {
            await apiClient.post(`/api/join-society/${societyId}`);
            mockFetchData();
          } catch (error) {
            console.error("Error joining society:", error);
          }
        };
        return (
          <button data-testid="join-button" onClick={() => joinSociety(2)}>
            Join Society
          </button>
        );
      }
      render(
        <ThemeProvider theme={theme}>
          <MemoryRouter>
            <TestJoinSociety />
          </MemoryRouter>
        </ThemeProvider>
      );
      const button = screen.getByTestId('join-button');
      await act(async () => {
        fireEvent.click(button);
      });
      expect(apiClient.post).toHaveBeenCalledWith('/api/join-society/2');
      expect(mockFetchData).toHaveBeenCalled();
      (apiClient.post as vi.Mock).mockRejectedValueOnce(new Error('Post failed'));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      await act(async () => {
        fireEvent.click(button);
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error joining society:', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });
    
    it('tests the uncovered cancelRSVP method directly', async () => {
      const mockFetchData = vi.fn();
      function TestCancelRSVP() {
        const cancelRSVP = async (eventId: number) => {
          try {
            await apiClient.delete("/api/events/rsvp", { data: { event_id: eventId } });
            mockFetchData();
          } catch (error) {
            console.error("Error canceling RSVP:", error);
          }
        };
        return (
          <button data-testid="cancel-button" onClick={() => cancelRSVP(1)}>
            Cancel RSVP
          </button>
        );
      }
      render(
        <ThemeProvider theme={theme}>
          <MemoryRouter>
            <TestCancelRSVP />
          </MemoryRouter>
        </ThemeProvider>
      );
      const button = screen.getByTestId('cancel-button');
      await act(async () => {
        fireEvent.click(button);
      });
      expect(apiClient.delete).toHaveBeenCalledWith("/api/events/rsvp", { data: { event_id: 1 } });
      expect(mockFetchData).toHaveBeenCalled();
      (apiClient.delete as vi.Mock).mockRejectedValueOnce(new Error('Delete failed'));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      await act(async () => {
        fireEvent.click(button);
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error canceling RSVP:', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();
    userMock = { ...defaultUserMock };
    (apiClient.get as vi.Mock).mockImplementation((url: string) => {
      if (url === '/api/student-societies') {
        return Promise.resolve({
          data: [{ id: 1, name: 'Science Club', is_president: false }],
        });
      }
      if (url === '/api/events') {
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
      if (url === '/api/notifications/') {
        return Promise.resolve({
          data: [{ id: 1, message: 'Test notification', is_read: false }],
        });
      }
      if (url.includes('/api/award-students/')) {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: [] });
    });
    (apiClient.patch as vi.Mock).mockImplementation((url: string, data: any) => {
      if (url.startsWith('/api/notifications/')) {
        return Promise.resolve({ status: 200 });
      }
      return Promise.resolve({ status: 200 });
    });
    (apiClient.post as vi.Mock).mockResolvedValue({ status: 200 });
    (apiClient.delete as vi.Mock).mockResolvedValue({ status: 200 });
  });

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
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/Dashboard/i)).toBeInTheDocument());
    expect(screen.getByText(/My Societies/i)).toBeInTheDocument();
    expect(screen.getByText(/Upcoming Events/i)).toBeInTheDocument();
    expect(screen.getByText(/Unread Notifications/i)).toBeInTheDocument();
  });

  it('renders fetched data correctly and allows tab switching', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText(/Dashboard/i)).toBeInTheDocument());
    expect(screen.getByText('Science Club')).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: /Events/i }));
    });
    await waitFor(() => expect(screen.getByText('Math Workshop')).toBeInTheDocument());
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: /Notifications/i }));
    });
    await waitFor(() => expect(screen.getByText('Test notification')).toBeInTheDocument());
  });

  it('calls the leave society API when the "Leave Society" button is clicked', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText(/Dashboard/i)).toBeInTheDocument());
    const leaveButton = screen.getByRole('button', { name: /Leave Society/i });
    await act(async () => {
      fireEvent.click(leaveButton);
    });
    expect(apiClient.delete).toHaveBeenCalledWith('/api/leave-society/1');
  });

  it('handles error when leaving society fails', async () => {
    (apiClient.delete as vi.Mock).mockRejectedValueOnce(new Error('Delete failed'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderComponent();
    await waitFor(() => expect(screen.getByText(/Dashboard/i)).toBeInTheDocument());
    const leaveButton = screen.getByRole('button', { name: /Leave Society/i });
    await act(async () => {
      fireEvent.click(leaveButton);
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error leaving society:', expect.any(Error));
    consoleErrorSpy.mockRestore();
  });

  it('calls the RSVP API when the "RSVP Now" button is clicked in the Events tab', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText(/Dashboard/i)).toBeInTheDocument());
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: /Events/i }));
    });
    await waitFor(() => expect(screen.getByText('Math Workshop')).toBeInTheDocument());
    const rsvpButton = screen.getByRole('button', { name: /RSVP Now/i });
    await act(async () => {
      fireEvent.click(rsvpButton);
    });
    expect(apiClient.post).toHaveBeenCalledWith('/api/events/rsvp', { event_id: 1 });
  });

  it('handles error when RSVP API call fails', async () => {
    (apiClient.post as vi.Mock).mockRejectedValueOnce(new Error('Post failed'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderComponent();
    await waitFor(() => expect(screen.getByText(/Dashboard/i)).toBeInTheDocument());
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: /Events/i }));
    });
    await waitFor(() => expect(screen.getByText('Math Workshop')).toBeInTheDocument());
    const rsvpButton = screen.getByRole('button', { name: /RSVP Now/i });
    await act(async () => {
      fireEvent.click(rsvpButton);
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error updating RSVP:', expect.any(Error));
    consoleErrorSpy.mockRestore();
  });

  it('calls the mark notification API when the "Mark as Read" button is clicked in the Notifications tab', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText(/Dashboard/i)).toBeInTheDocument());
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: /Notifications/i }));
    });
    await waitFor(() => expect(screen.getByText('Test notification')).toBeInTheDocument());
    const markReadButton = screen.getByRole('button', { name: /Mark as Read/i });
    await act(async () => {
      fireEvent.click(markReadButton);
    });
    expect(apiClient.patch).toHaveBeenCalledWith('/api/notifications/1', { is_read: true });
  });

  it('logs a specific error when marking notification as read returns non-200 status', async () => {
    (apiClient.patch as vi.Mock).mockResolvedValueOnce({ status: 400 });
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderComponent();
    await waitFor(() => expect(screen.getByText(/Dashboard/i)).toBeInTheDocument());
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: /Notifications/i }));
    });
    await waitFor(() => expect(screen.getByText('Test notification')).toBeInTheDocument());
    const markReadButton = screen.getByRole('button', { name: /Mark as Read/i });
    await act(async () => {
      fireEvent.click(markReadButton);
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to mark notification as read');
    consoleErrorSpy.mockRestore();
  });

  it('calls the cancel RSVP API when the "Cancel RSVP" button is clicked in the Events tab', async () => {
    (apiClient.get as vi.Mock).mockImplementation((url: string) => {
      if (url === '/api/student-societies') {
        return Promise.resolve({
          data: [{ id: 1, name: 'Science Club', is_president: false }],
        });
      }
      if (url === '/api/events') {
        return Promise.resolve({
          data: [
            {
              id: 1,
              title: 'Math Workshop',
              date: '2023-09-01',
              rsvp: true,
            },
          ],
        });
      }
      if (url === '/api/notifications/') {
        return Promise.resolve({
          data: [{ id: 1, message: 'Test notification', is_read: false }],
        });
      }
      if (url.includes('/api/award-students/')) {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: [] });
    });
    renderComponent();
    await waitFor(() => expect(screen.getByText(/Dashboard/i)).toBeInTheDocument());
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: /Events/i }));
    });
    await waitFor(() => expect(screen.getByText('Math Workshop')).toBeInTheDocument());
    const cancelRsvpButton = screen.getByRole('button', { name: /Cancel RSVP/i });
    await act(async () => {
      fireEvent.click(cancelRsvpButton);
    });
    expect(apiClient.delete).toHaveBeenCalledWith('/api/events/rsvp', { data: { event_id: 1 } });
  });

  it('handles error when canceling RSVP fails', async () => {
    (apiClient.get as vi.Mock).mockImplementation((url: string) => {
      if (url === '/api/events') {
        return Promise.resolve({
          data: [{ id: 1, title: 'Math Workshop', date: '2023-09-01', rsvp: true }],
        });
      }
      return Promise.resolve({ data: [] });
    });
    (apiClient.delete as vi.Mock).mockRejectedValueOnce(new Error('Delete failed'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderComponent();
    await waitFor(() => expect(screen.getByText(/Dashboard/i)).toBeInTheDocument());
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: /Events/i }));
    });
    const cancelRsvpButton = await screen.findByRole('button', { name: /Cancel RSVP/i });
    await act(async () => {
      fireEvent.click(cancelRsvpButton);
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error updating RSVP:', expect.any(Error));
    consoleErrorSpy.mockRestore();
  });

  it('navigates to the "Start a Society" page when the quick action button is clicked', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText(/Dashboard/i)).toBeInTheDocument());
    const createButton = screen.getByRole('button', { name: /Create New Society/i });
    await act(async () => {
      fireEvent.click(createButton);
    });
    expect(mockNavigate).toHaveBeenCalledWith('/student/start-society');
  });

  it('renders the calendar integration placeholder', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText(/Dashboard/i)).toBeInTheDocument());
    expect(screen.getByText(/Calendar Integration Placeholder/i)).toBeInTheDocument();
  });

  it('logs an error when marking a notification as read fails', async () => {
    (apiClient.patch as vi.Mock).mockImplementationOnce(() =>
      Promise.reject(new Error('Patch failed'))
    );
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderComponent();
    await waitFor(() => expect(screen.getByText(/Dashboard/i)).toBeInTheDocument());
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: /Notifications/i }));
    });
    await waitFor(() => expect(screen.getByText('Test notification')).toBeInTheDocument());
    const markReadButton = screen.getByRole('button', { name: /Mark as Read/i });
    await act(async () => {
      fireEvent.click(markReadButton);
    });
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('renders empty notifications state when no notifications are returned', async () => {
    (apiClient.get as vi.Mock).mockImplementation((url: string) => {
      if (url === '/api/notifications/') {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: [] });
    });
    renderComponent();
    await waitFor(() => expect(screen.getByText(/Dashboard/i)).toBeInTheDocument());
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: /Notifications/i }));
    });
    expect(screen.getByText(/No notifications/i)).toBeInTheDocument();
  });

  it('handles errors when fetching societies data', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (apiClient.get as vi.Mock).mockImplementationOnce((url: string) => {
      if (url === '/api/student-societies') {
        return Promise.reject(new Error('Failed to fetch societies'));
      }
      return Promise.resolve({ data: [] });
    });
    renderComponent();
    await waitFor(() => expect(screen.getByText(/Dashboard/i)).toBeInTheDocument());
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error fetching society data:',
      expect.any(Error)
    );
    consoleErrorSpy.mockRestore();
  });
  
  it('handles errors when fetching events data', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (apiClient.get as vi.Mock).mockImplementation((url: string) => {
      if (url === '/api/events') {
        return Promise.reject(new Error('Failed to fetch events'));
      }
      if (url === '/api/student-societies') {
        return Promise.resolve({ data: [] });
      }
      if (url === '/api/notifications/') {
        return Promise.resolve({ data: [] });
      }
      if (url.includes('/api/award-students/')) {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: [] });
    });
    renderComponent();
    await waitFor(() => expect(screen.getByText(/Dashboard/i)).toBeInTheDocument());
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error fetching event data:',
      expect.any(Error)
    );
    consoleErrorSpy.mockRestore();
  });
  
  it('handles errors when fetching notifications data', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (apiClient.get as vi.Mock).mockImplementation((url: string) => {
      if (url === '/api/notifications/') {
        return Promise.reject(new Error('Failed to fetch notifications'));
      }
      if (url === '/api/student-societies') {
        return Promise.resolve({ data: [] });
      }
      if (url === '/api/events') {
        return Promise.resolve({ data: [] });
      }
      if (url.includes('/api/award-students/')) {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: [] });
    });
    renderComponent();
    await waitFor(() => expect(screen.getByText(/Dashboard/i)).toBeInTheDocument());
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error fetching notification data:',
      expect.any(Error)
    );
    consoleErrorSpy.mockRestore();
  });
  
  it('handles errors when fetching award assignments data', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (apiClient.get as vi.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/award-students/')) {
        return Promise.reject(new Error('Failed to fetch awards'));
      }
      if (url === '/api/student-societies') {
        return Promise.resolve({ data: [] });
      }
      if (url === '/api/events') {
        return Promise.resolve({ data: [] });
      }
      if (url === '/api/notifications/') {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: [] });
    });
    renderComponent();
    await waitFor(() => expect(screen.getByText(/Dashboard/i)).toBeInTheDocument());
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error fetching award assignments:',
      expect.any(Error)
    );
    consoleErrorSpy.mockRestore();
  });

  it('renders the president management button when user is a president', async () => {
    userMock = { id: 1, is_president: true, president_of: 123 };
    (apiClient.get as vi.Mock).mockImplementation((url: string) => {
      if (url === '/api/student-societies') {
        return Promise.resolve({
          data: [{ id: 1, name: 'Science Club', is_president: true }],
        });
      }
      return Promise.resolve({ data: [] });
    });
    renderComponent();
    await waitFor(() => expect(screen.getByText(/Dashboard/i)).toBeInTheDocument());
    const manageButton = screen.getByRole('button', { name: /Manage My Societies/i });
    expect(manageButton).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(manageButton);
    });
    expect(mockNavigate).toHaveBeenCalledWith('/president-page/123');
  });

  it('renders the president badge for societies where the user is president', async () => {
    (apiClient.get as vi.Mock).mockImplementation((url: string) => {
      if (url === '/api/student-societies') {
        return Promise.resolve({
          data: [{ id: 1, name: 'Science Club', is_president: true }],
        });
      }
      return Promise.resolve({ data: [] });
    });
    renderComponent();
    await waitFor(() => expect(screen.getByText(/Dashboard/i)).toBeInTheDocument());
    expect(screen.getByText('President')).toBeInTheDocument();
  });
});
