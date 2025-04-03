import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import ViewInbox from '../ViewInbox';
import { apiClient } from '../../../api';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';

// Mock navigate function
const mockNavigate = vi.fn();

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock API client
vi.mock('../../../api', () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock data for tests
const mockInboxNotifications = [
  {
    id: 101,
    header: 'New Society Announcement',
    body: 'Computer Science Society has a new event',
    is_read: false,
    created_at: '2025-01-02T12:00:00Z',
    type: 'notification'
  },
  {
    id: 102,
    header: 'Reminder',
    body: 'Don\'t forget about tomorrow\'s meeting',
    is_read: true,
    created_at: '2025-01-01T10:00:00Z',
    type: 'notification'
  }
];

const mockReplyNotifications = [
  {
    id: 201,
    header: 'Reply to your report',
    body: 'Your report has been answered',
    is_read: false,
    send_time: '2025-01-03T14:00:00Z',
    type: 'report_reply',
    report_id: 123
  }
];

describe('ViewInbox Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set up default mock responses for API calls
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

  const renderComponent = (theme = 'dark') => {
    const customTheme = createTheme({
      palette: {
        mode: theme === 'light' ? 'light' : 'dark',
      },
    });

    return render(
      <ThemeProvider theme={customTheme}>
        <MemoryRouter>
          <ViewInbox />
        </MemoryRouter>
      </ThemeProvider>
    );
  };

  it('displays loading state initially', async () => {
    // Make API calls never resolve to keep loading state
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
    
    // Check that all notifications are displayed
    expect(screen.getByText('New Society Announcement')).toBeInTheDocument();
    expect(screen.getByText('Computer Science Society has a new event')).toBeInTheDocument();
    expect(screen.getByText('Reminder')).toBeInTheDocument();
    expect(screen.getByText('Reply to your report')).toBeInTheDocument();
  });

  it('displays empty state when there are no notifications', async () => {
    // Mock empty responses for both API calls
    vi.mocked(apiClient.get).mockImplementation(() => Promise.resolve({ data: [] }));
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('No new notifications.')).toBeInTheDocument();
    });
  });

  it('displays "Mark as Read" for unread notifications', async () => {
    renderComponent();
    
    await waitFor(() => {
      // There should be two unread notifications in our mock data
      const markAsReadButtons = screen.getAllByText('Mark as Read');
      expect(markAsReadButtons.length).toBe(2);
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
    
    // Find the notification containing "New Society Announcement" text
    const notification = screen.getByText('New Society Announcement').closest('.p-5');
    const markAsReadButton = within(notification).getByText('Mark as Read');
    
    fireEvent.click(markAsReadButton);
    
    await waitFor(() => {
      // Should call patch with the correct URL for a regular notification
      expect(apiClient.patch).toHaveBeenCalledWith(
        '/api/notifications/101/',
        { is_read: true }
      );
    });
  });

  it('marks a report reply notification as read', async () => {
    // Mock the reply notification as unread
    const unreadReplyNotification = [{
      ...mockReplyNotifications[0],
      is_read: false
    }];
    
    vi.mocked(apiClient.get).mockImplementation((url) => {
      if (url === '/api/notifications/inbox/') {
        return Promise.resolve({ data: mockInboxNotifications });
      } else if (url === '/api/reports/reply-notifications') {
        return Promise.resolve({ data: unreadReplyNotification });
      }
      return Promise.resolve({ data: [] });
    });
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Reply to your report')).toBeInTheDocument();
    });
    
    // Find the notification containing "Reply to your report" text
    const notification = screen.getByText('Reply to your report').closest('.p-5');
    expect(notification).not.toBeNull();
    
    const markAsReadButton = within(notification).getByText('Mark as Read');
    expect(markAsReadButton).toBeInTheDocument();
    
    fireEvent.click(markAsReadButton);
    
    await waitFor(() => {
      // Should call patch with the correct URL for a report reply notification
      expect(apiClient.patch).toHaveBeenCalledWith('/api/reports/reply-notifications/201');
    });
  });

  it('deletes a notification when delete button is clicked', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('New Society Announcement')).toBeInTheDocument();
    });
    
    // Find the notification containing "New Society Announcement" text
    const notification = screen.getByText('New Society Announcement').closest('.p-5');
    expect(notification).not.toBeNull();
    
    // Get the delete button within this notification
    const deleteButton = within(notification).getByTitle('Delete notification');
    fireEvent.click(deleteButton);
    
    await waitFor(() => {
      // Should call delete with the correct URL for a regular notification
      expect(apiClient.delete).toHaveBeenCalledWith('/api/notifications/inbox/101');
    });
  });

  it('deletes a report reply notification', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Reply to your report')).toBeInTheDocument();
    });
    
    // Find the notification containing "Reply to your report" text
    const notification = screen.getByText('Reply to your report').closest('.p-5');
    expect(notification).not.toBeNull();
    
    // Get the delete button within this notification
    const deleteButton = within(notification).getByTitle('Delete notification');
    fireEvent.click(deleteButton);
    
    await waitFor(() => {
      // Should call delete with the correct URL for a report reply notification
      expect(apiClient.delete).toHaveBeenCalledWith('/api/reports/reply-notifications/201');
    });
  });

  it('navigates to the report thread when "View Reply" is clicked', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('View Reply')).toBeInTheDocument();
    });
    
    // Click the View Reply button
    const viewReplyButton = screen.getByText('View Reply');
    fireEvent.click(viewReplyButton);
    
    // Should call navigate with the correct path
    expect(mockNavigate).toHaveBeenCalledWith('/student/report-thread/123');
  });

  it('handles errors when fetching notifications', async () => {
    // Mock console.error to prevent output in tests
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Make API calls fail
    vi.mocked(apiClient.get).mockRejectedValue(new Error('Failed to fetch'));
    
    renderComponent();
    
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching notifications:',
        expect.anything()
      );
    });
    
    // Should show empty state on error
    expect(screen.getByText('No new notifications.')).toBeInTheDocument();
    
    consoleErrorSpy.mockRestore();
  });

  it('handles errors when marking notifications as read', async () => {
    // Mock console.error to prevent output in tests
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Make patch call fail
    vi.mocked(apiClient.patch).mockRejectedValue(new Error('Failed to mark as read'));
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getAllByText('Mark as Read').length).toBeGreaterThan(0);
    });
    
    // Click a Mark as Read button
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
    // Mock console.error to prevent output in tests
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Make delete call fail
    vi.mocked(apiClient.delete).mockRejectedValue(new Error('Failed to delete'));
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getAllByTitle('Delete notification').length).toBeGreaterThan(0);
    });
    
    // Click a delete button
    fireEvent.click(screen.getAllByTitle('Delete notification')[0]);
    
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error deleting notification:',
        expect.anything()
      );
    });
    
    consoleErrorSpy.mockRestore();
  });

  it('sorts notifications by date with newest first', async () => {
    renderComponent();
    
    await waitFor(() => {
      // Wait for all notifications to be loaded
      expect(screen.getByText('Reply to your report')).toBeInTheDocument();
      expect(screen.getByText('New Society Announcement')).toBeInTheDocument();
      expect(screen.getByText('Reminder')).toBeInTheDocument();
    });
    
    // Get all notification elements in order
    const notifications = screen.getAllByText(/Reply to your report|New Society Announcement|Reminder/);
    
    // First notification should be the most recent (the report reply)
    expect(notifications[0].textContent).toBe('Reply to your report');
    
    // Second notification should be New Society Announcement (2nd most recent)
    expect(notifications[1].textContent).toBe('New Society Announcement');
    
    // Third notification should be Reminder (oldest)
    expect(notifications[2].textContent).toBe('Reminder');
  });
});