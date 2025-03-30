import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import ViewInbox from '../ViewInbox';
import { apiClient } from '../../../api';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';


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
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));


const mockInboxNotifications = [
  {
    id: 1,
    header: 'New Society Announcement',
    body: 'Computer Science Society has a new event',
    is_read: false,
    created_at: '2025-01-02T12:00:00Z',
    type: 'notification'
  },
  {
    id: 2,
    header: 'Reminder',
    body: 'Don\'t forget about tomorrow\'s meeting',
    is_read: true,
    created_at: '2025-01-01T10:00:00Z',
    type: 'notification'
  }
];

const mockReplyNotifications = [
  {
    id: 1,
    header: 'Reply to your report',
    body: 'Your report has been answered',
    is_read: false,
    send_time: '2025-01-03T14:00:00Z',
    type: 'report_reply',
    report_id: 123
  }
];


const mockNavigate = vi.fn();

describe('ViewInbox Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    
    vi.mocked(apiClient.get).mockImplementation((url) => {
      if (url === '/api/notifications/inbox/') {
        return Promise.resolve({ data: mockInboxNotifications });
      } else if (url === '/api/reports/reply-notifications') {
        return Promise.resolve({ data: mockReplyNotifications });
      }
      return Promise.resolve({ data: [] });
    });

    vi.mocked(apiClient.patch).mockResolvedValue({ status: 200 });
    vi.mocked(apiClient.delete).mockResolvedValue({ status: 204 });
  });

  const renderComponent = () => {
    const theme = createTheme({
      palette: {
        mode: 'dark',
      },
    });

    return render(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <ViewInbox />
        </MemoryRouter>
      </ThemeProvider>
    );
  };

  it('displays loading state initially', async () => {
    
    vi.mocked(apiClient.get).mockImplementation(() => new Promise(() => {}));
    
    renderComponent();
    
    expect(screen.getByText('Loading notifications...')).toBeInTheDocument();
  });

  it('fetches and displays both types of notifications', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/notifications/inbox/');
      expect(apiClient.get).toHaveBeenCalledWith('/api/reports/reply-notifications');
    });
    
    
    expect(screen.getByText('New Society Announcement')).toBeInTheDocument();
    expect(screen.getByText('Computer Science Society has a new event')).toBeInTheDocument();
    expect(screen.getByText('Reminder')).toBeInTheDocument();
    expect(screen.getByText('Reply to your report')).toBeInTheDocument();
  });

  it('displays empty state when there are no notifications', async () => {
    
    vi.mocked(apiClient.get).mockImplementation(() => Promise.resolve({ data: [] }));
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('No new notifications.')).toBeInTheDocument();
    });
  });

  it('displays "Mark as Read" for unread notifications', async () => {
    renderComponent();
    
    await waitFor(() => {
      
      const markAsReadButtons = screen.getAllByText('Mark as Read');
      expect(markAsReadButtons.length).toBeGreaterThan(0);
    });
  });

  it('displays "Read" for read notifications', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Read')).toBeInTheDocument();
    });
  });

  it('displays "View Reply" button for report reply notifications', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('View Reply')).toBeInTheDocument();
    });
  });

  it('marks a notification as read when "Mark as Read" is clicked', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('New Society Announcement')).toBeInTheDocument();
    });
    
    
    const notification = screen.getByText('New Society Announcement').closest('.p-5');
    
    
    const markAsReadButton = within(notification).getByText('Mark as Read');
    fireEvent.click(markAsReadButton);
    
    await waitFor(() => {
      
      
      expect(apiClient.patch).toHaveBeenCalled();
      
      const firstCallArg = apiClient.patch.mock.calls[0][0];
      expect(firstCallArg.includes('/api/notifications/')).toBeTruthy();
    });
  });

  it('marks a report reply notification as read', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Reply to your report')).toBeInTheDocument();
    });
    
    
    const notification = screen.getByText('Reply to your report').closest('.p-5');
    
    
    const markAsReadButton = within(notification).getByText('Mark as Read');
    fireEvent.click(markAsReadButton);
    
    await waitFor(() => {
      
      expect(apiClient.patch).toHaveBeenCalled();
      
      const firstCallArg = apiClient.patch.mock.calls[0][0];
      expect(firstCallArg.includes('/api/reports/reply-notifications/')).toBeTruthy();
    });
  });

  it('deletes a notification when delete button is clicked', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('New Society Announcement')).toBeInTheDocument();
    });
    
    
    const notification = screen.getByText('New Society Announcement').closest('.p-5');
    
    
    const deleteButton = within(notification).getByTitle('Delete notification');
    fireEvent.click(deleteButton);
    
    await waitFor(() => {
      
      expect(apiClient.delete).toHaveBeenCalled();
      
      const firstCallArg = apiClient.delete.mock.calls[0][0];
      expect(firstCallArg.includes('/api/notifications/inbox/')).toBeTruthy();
    });
  });

  it('deletes a report reply notification', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Reply to your report')).toBeInTheDocument();
      expect(screen.getByText('View Reply')).toBeInTheDocument();
    });
    
    
    const notification = screen.getByText('View Reply').closest('.p-5');
    
    
    const deleteButton = within(notification).getByTitle('Delete notification');
    fireEvent.click(deleteButton);
    
    await waitFor(() => {
      
      expect(apiClient.delete).toHaveBeenCalled();
      
      const firstCallArg = apiClient.delete.mock.calls[0][0];
      expect(firstCallArg.includes('/api/reports/reply-notifications/')).toBeTruthy();
    });
  });

  it('navigates to the report thread when "View Reply" is clicked', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('View Reply')).toBeInTheDocument();
    });
    
    
    fireEvent.click(screen.getByText('View Reply'));
    
    
    expect(mockNavigate).toHaveBeenCalledWith('/student/report-thread/123');
  });

  it('handles errors when fetching notifications', async () => {
    
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(apiClient.get).mockRejectedValue(new Error('Failed to fetch'));
    
    renderComponent();
    
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching notifications:',
        expect.anything()
      );
    });
    
    
    expect(screen.getByText('No new notifications.')).toBeInTheDocument();
    
    consoleErrorSpy.mockRestore();
  });

  it('handles errors when marking notifications as read', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(apiClient.patch).mockRejectedValue(new Error('Failed to mark as read'));
    
    renderComponent();
    
    await waitFor(() => {
      const markAsReadButtons = screen.getAllByText('Mark as Read');
      expect(markAsReadButtons.length).toBeGreaterThan(0);
    });
    
    
    fireEvent.click(screen.getAllByText('Mark as Read')[0]);
    
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error marking notification as read:',
        expect.anything()
      );
    });
    
    consoleErrorSpy.mockRestore();
  });

  it('handles errors when deleting notifications', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(apiClient.delete).mockRejectedValue(new Error('Failed to delete'));
    
    renderComponent();
    
    await waitFor(() => {
      const deleteButtons = screen.getAllByTitle('Delete notification');
      expect(deleteButtons.length).toBeGreaterThan(0);
    });
    
    
    fireEvent.click(screen.getAllByTitle('Delete notification')[0]);
    
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error deleting notification:',
        expect.anything()
      );
    });
    
    consoleErrorSpy.mockRestore();
  });
});