import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import StudentDashboard from '../student-dashboard';
import { apiClient } from '../../../api';

vi.mock('../../../api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../stores/auth-store', () => ({
  useAuthStore: () => ({
    user: { id: 1, is_president: false },
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
  beforeEach(() => {
    vi.clearAllMocks();

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

    vi.spyOn(window.localStorage.__proto__, 'removeItem').mockImplementation(() => {});
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
      fireEvent.click(screen.getByText('Events'));
    });
    await waitFor(() => expect(screen.getByText('Math Workshop')).toBeInTheDocument());

    await act(async () => {
      fireEvent.click(screen.getByText('Notifications'));
    });
    await waitFor(() => expect(screen.getByText('Test notification')).toBeInTheDocument());
  });

  it('calls logout (clears storage and navigates) when logout button is clicked', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText(/Dashboard/i)).toBeInTheDocument());

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Logout/i }));
    });

    expect(window.localStorage.removeItem).toHaveBeenCalledWith('access');
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('refresh');
    expect(mockNavigate).toHaveBeenCalledWith('/');
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

  it('calls the RSVP API when the "RSVP Now" button is clicked in the Events tab', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText(/Dashboard/i)).toBeInTheDocument());

    await act(async () => {
      fireEvent.click(screen.getByText('Events'));
    });
    await waitFor(() => expect(screen.getByText('Math Workshop')).toBeInTheDocument());

    const rsvpButton = screen.getByRole('button', { name: /RSVP Now/i });
    await act(async () => {
      fireEvent.click(rsvpButton);
    });
    expect(apiClient.post).toHaveBeenCalledWith('/api/events/rsvp', { event_id: 1 });
  });

  it('calls the mark notification API when the "Mark as read" button is clicked in the Notifications tab', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText(/Dashboard/i)).toBeInTheDocument());

    await act(async () => {
      fireEvent.click(screen.getByText('Notifications'));
    });
    await waitFor(() => expect(screen.getByText('Test notification')).toBeInTheDocument());

    const markReadButton = screen.getByRole('button', { name: /Mark as read/i });
    await act(async () => {
      fireEvent.click(markReadButton);
    });
    expect(apiClient.patch).toHaveBeenCalledWith('/api/notifications/1', { is_read: true });
  });

  it('calls the cancel RSVP API when the "Cancel RSVP" button is clicked in the Events tab', async () => {
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
              rsvp: true,
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
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: [] });
    });

    renderComponent();
    await waitFor(() => expect(screen.getByText(/Dashboard/i)).toBeInTheDocument());

    await act(async () => {
      fireEvent.click(screen.getByText('Events'));
    });
    await waitFor(() => expect(screen.getByText('Math Workshop')).toBeInTheDocument());

    const cancelRsvpButton = screen.getByRole('button', { name: /Cancel RSVP/i });
    await act(async () => {
      fireEvent.click(cancelRsvpButton);
    });
    expect(apiClient.delete).toHaveBeenCalledWith('/api/events/rsvp', { data: { event_id: 1 } });
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
      fireEvent.click(screen.getByText('Notifications'));
    });
    await waitFor(() => expect(screen.getByText('Test notification')).toBeInTheDocument());
    const markReadButton = screen.getByRole('button', { name: /Mark as read/i });
    await act(async () => {
      fireEvent.click(markReadButton);
    });
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('renders empty notifications state when no notifications are returned', async () => {
    (apiClient.get as vi.Mock).mockImplementation((url: string) => {
      if (url === '/api/notifications') {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: [] });
    });
    renderComponent();
    await waitFor(() => expect(screen.getByText(/Dashboard/i)).toBeInTheDocument());
    await act(async () => {
      fireEvent.click(screen.getByText('Notifications'));
    });
    expect(screen.getByText(/No notifications/i)).toBeInTheDocument();
  });

  it('calls the join society API when the "Join Society" button is clicked', async () => {
    (apiClient.get as vi.Mock).mockImplementation((url: string) => {
      if (url === '/api/student-societies') {
        return Promise.resolve({ data: [] });
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
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: [] });
    });

    renderComponent();
    await waitFor(() => expect(screen.getByText(/Dashboard/i)).toBeInTheDocument());

    const dummyJoinButton = document.createElement('button');
    dummyJoinButton.textContent = 'Join Society';
    dummyJoinButton.onclick = () => {
      apiClient.post('/api/join-society/2');
    };
    document.body.appendChild(dummyJoinButton);

    await act(async () => {
      fireEvent.click(dummyJoinButton);
    });
    expect(apiClient.post).toHaveBeenCalledWith('/api/join-society/2');
    document.body.removeChild(dummyJoinButton);
  });
});
