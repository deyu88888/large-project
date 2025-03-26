import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ActivityLogList from '../ActivityLog';
import { apiClient, apiPaths } from '../../../api';
import { SearchContext } from '../../../components/layout/SearchContext';

// Mock the modules before importing component
vi.mock('../../../api', () => {
  return {
    apiClient: {
      get: vi.fn(),
      delete: vi.fn(),
      post: vi.fn(),
    },
    apiPaths: {
      USER: {
        ACTIVITYLOG: '/api/activity-logs',
        DELETEACTIVITYLOG: (id) => `/api/activity-logs/${id}`,
        UNDO_DELETE: (id) => `/api/activity-logs/${id}/undo`,
      },
    },
  };
});

// Mock the useSettingsStore
vi.mock('../../../stores/settings-store', () => ({
  useSettingsStore: () => ({ drawer: false }),
}));

// Mock fetchPendingRequests
vi.mock('../utils', () => ({
  fetchPendingRequests: vi.fn(),
}));

// Import the mocked fetchPendingRequests
import { fetchPendingRequests } from '../utils';

// Create light and dark themes for testing
const lightTheme = createTheme({
  palette: {
    mode: 'light',
  }
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  }
});

// Mock data for testing - order matters due to sorting
const mockActivityLogs = [
  {
    id: 2, // This will appear first in the UI due to sorting
    action_type: 'DELETE',
    target_type: 'EVENT',
    target_name: 'Annual Meeting',
    performed_by: {
      id: 456,
      first_name: 'John',
      last_name: 'Doe'
    },
    timestamp: '2025-03-16T14:20:00Z',
    reason: 'Event canceled',
  },
  {
    id: 1,
    action_type: 'CREATE',
    target_type: 'SOCIETY',
    target_name: 'Chess Club',
    performed_by: {
      id: 123,
      first_name: 'Admin',
      last_name: 'User'
    },
    timestamp: '2025-03-15T10:30:00Z',
    reason: 'New society creation',
  }
];

describe('ActivityLogList Component', () => {
  // Setup for each test
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock fetchPendingRequests to return our mock data
    fetchPendingRequests.mockResolvedValue(mockActivityLogs);
    
    // Default API mock responses
    apiClient.get.mockResolvedValue({
      data: mockActivityLogs
    });
    
    apiClient.delete.mockResolvedValue({
      data: { success: true }
    });
    
    apiClient.post.mockResolvedValue({
      data: { success: true }
    });
    
    // Mock global alert
    global.alert = vi.fn();
  });

  const renderComponent = (searchTerm = '') => {
    return render(
      <ThemeProvider theme={lightTheme}>
        <SearchContext.Provider value={{ searchTerm, setSearchTerm: vi.fn() }}>
          <ActivityLogList />
        </SearchContext.Provider>
      </ThemeProvider>
    );
  };

  it('renders loading state initially', async () => {
    // Mock delay for the API response
    fetchPendingRequests.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(mockActivityLogs), 100))
    );

    render(
      <ThemeProvider theme={lightTheme}>
        <SearchContext.Provider value={{ searchTerm: '', setSearchTerm: vi.fn() }}>
          <ActivityLogList />
        </SearchContext.Provider>
      </ThemeProvider>
    );
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('fetches and displays activity logs correctly', async () => {
    await act(async () => {
      renderComponent();
    });
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check if fetchPendingRequests was called
    expect(fetchPendingRequests).toHaveBeenCalledWith('/api/activity-logs');
    
    // Check if activity log header is displayed
    expect(screen.getByText('Activity Log')).toBeInTheDocument();
    
    // Check if table headers are displayed
    expect(screen.getByText('Action Type')).toBeInTheDocument();
    
    // Check if data is displayed
    expect(screen.getByText('DELETE')).toBeInTheDocument();
    expect(screen.getByText('EVENT')).toBeInTheDocument();
    
    // Check if Delete and Undo buttons are displayed
    const deleteButtons = screen.getAllByText('Delete');
    const undoButtons = screen.getAllByText('Undo');
    expect(deleteButtons.length).toBe(mockActivityLogs.length);
    expect(undoButtons.length).toBe(mockActivityLogs.length);
  });

  it('handles search filtering correctly', async () => {
    await act(async () => {
      renderComponent('chess');
    });
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Should show Chess Club but not Annual Meeting
    expect(screen.getByText('Chess Club')).toBeInTheDocument();
    expect(screen.queryByText('Annual Meeting')).not.toBeInTheDocument();
  });

  it('handles the delete action with dialog confirmation', async () => {
    await act(async () => {
      renderComponent();
    });
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Refresh mock for fetchPendingRequests
    fetchPendingRequests.mockClear();
    
    // Click delete button for the first item
    const deleteButtons = screen.getAllByText('Delete');
    await act(async () => {
      fireEvent.click(deleteButtons[0]);
    });
    
    // Check if confirmation dialog appears
    expect(screen.getByText('Confirm Permanent Deletion')).toBeInTheDocument();
    
    // Click Delete Permanently button
    const confirmButton = screen.getByText('Delete Permanently');
    await act(async () => {
      fireEvent.click(confirmButton);
    });
    
    // Check if delete API was called with ID 2 (first row in UI)
    expect(apiClient.delete).toHaveBeenCalledWith('/api/activity-logs/2');
    
    // Check if fetchPendingRequests was called again to refresh data
    expect(fetchPendingRequests).toHaveBeenCalledTimes(1);
  });

  it('cancels delete action when cancel button is clicked', async () => {
    await act(async () => {
      renderComponent();
    });
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Click delete button for the first item
    const deleteButtons = screen.getAllByText('Delete');
    await act(async () => {
      fireEvent.click(deleteButtons[0]);
    });
    
    // Verify the dialog is open
    expect(screen.getByText('Confirm Permanent Deletion')).toBeInTheDocument();
    
    // Click cancel button
    const cancelButton = screen.getByText('Cancel');
    await act(async () => {
      fireEvent.click(cancelButton);
    });
    
    // Delete API should not be called
    expect(apiClient.delete).not.toHaveBeenCalled();
  });

  it('handles the undo action correctly', async () => {
    await act(async () => {
      renderComponent();
    });
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Click the first Undo button (which will have ID 2 due to sorting)
    const firstUndoButton = screen.getAllByText('Undo')[0];
    await act(async () => {
      fireEvent.click(firstUndoButton);
    });
    
    // Check if undo API was called with the correct ID (2)
    expect(apiClient.post).toHaveBeenCalledWith('/api/activity-logs/2/undo');
    
    // Success - no need to check for alert/snackbar since it's using custom notification
  });

  it('handles error when fetching data', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock API error
    fetchPendingRequests.mockRejectedValueOnce(new Error('API error'));
    
    await act(async () => {
      renderComponent();
    });
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check if error was logged
    expect(consoleErrorSpy).toHaveBeenCalled();
    
    consoleErrorSpy.mockRestore();
  });

  it('handles error when deleting log', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock successful initial fetch but error on delete
    apiClient.delete.mockRejectedValueOnce(new Error('Delete error'));
    
    await act(async () => {
      renderComponent();
    });
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Click delete button for the first item
    const deleteButtons = screen.getAllByText('Delete');
    await act(async () => {
      fireEvent.click(deleteButtons[0]);
    });
    
    // Click Delete Permanently button
    const confirmButton = screen.getByText('Delete Permanently');
    await act(async () => {
      fireEvent.click(confirmButton);
    });
    
    // Check if error was logged
    expect(consoleErrorSpy).toHaveBeenCalled();
    
    // Check if API was called but don't check for notification
    expect(apiClient.delete).toHaveBeenCalledWith('/api/activity-logs/2');
    
    consoleErrorSpy.mockRestore();
  });

  it('handles error when undoing action', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock error on undo
    apiClient.post.mockRejectedValueOnce(new Error('Undo error'));
    
    await act(async () => {
      renderComponent();
    });
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Click undo button for the first item specifically
    const firstUndoButton = screen.getAllByText('Undo')[0];
    await act(async () => {
      fireEvent.click(firstUndoButton);
    });
    
    // Check if error was logged
    expect(consoleErrorSpy).toHaveBeenCalled();
    
    // Check if API was called with the right parameters
    expect(apiClient.post).toHaveBeenCalledWith('/api/activity-logs/2/undo');
    
    consoleErrorSpy.mockRestore();
  });

  it('renders correctly in dark mode', async () => {
    await act(async () => {
      render(
        <ThemeProvider theme={darkTheme}>
          <SearchContext.Provider value={{ searchTerm: '', setSearchTerm: vi.fn() }}>
            <ActivityLogList />
          </SearchContext.Provider>
        </ThemeProvider>
      );
    });
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check if the component renders with dark theme
    expect(screen.getByText('Activity Log')).toBeInTheDocument();
  });
});