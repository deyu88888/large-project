import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ActivityLogList from '../ActivityLog';
import { apiClient, apiPaths } from '../../../api';
import { SearchContext } from '../../../components/layout/SearchContext';

// Mock the modules
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

vi.mock('../../../stores/settings-store', () => ({
  useSettingsStore: () => ({ drawer: false }),
}));

const mockFetchPendingRequests = vi.fn();
vi.mock('../../../utils/utils', () => ({
  fetchPendingRequests: () => mockFetchPendingRequests()
}));

// Create themes for testing
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

// Mock data for testing
const mockActivityLogs = [
  {
    id: 2,
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
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchPendingRequests.mockResolvedValue(mockActivityLogs);
    
    apiClient.get.mockResolvedValue({
      data: mockActivityLogs
    });
    
    apiClient.delete.mockResolvedValue({
      data: { success: true }
    });
    
    apiClient.post.mockResolvedValue({
      data: { success: true }
    });
    
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
    mockFetchPendingRequests.mockImplementation(() => 
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
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    expect(mockFetchPendingRequests).toHaveBeenCalled();
    expect(screen.getByText('Activity Log')).toBeInTheDocument();
    expect(screen.getByText('Action Type')).toBeInTheDocument();
    expect(screen.getByText('DELETE')).toBeInTheDocument();
    expect(screen.getByText('EVENT')).toBeInTheDocument();
    
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

    mockFetchPendingRequests.mockClear();
    
    const deleteButtons = screen.getAllByText('Delete');
    await act(async () => {
      fireEvent.click(deleteButtons[0]);
    });
    
    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(screen.getByText(/Confirm Permanent Deletion/i)).toBeInTheDocument();
    });
    
    const confirmButton = screen.getByText('Delete Permanently');
    await act(async () => {
      fireEvent.click(confirmButton);
    });
    
    expect(apiClient.delete).toHaveBeenCalled();
    expect(mockFetchPendingRequests).toHaveBeenCalledTimes(1);
  });

  it('cancels delete action when cancel button is clicked', async () => {
    await act(async () => {
      renderComponent();
    });
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    const deleteButtons = screen.getAllByText('Delete');
    await act(async () => {
      fireEvent.click(deleteButtons[0]);
    });
    
    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });
    
    const cancelButton = screen.getByText('Cancel');
    await act(async () => {
      fireEvent.click(cancelButton);
    });
    
    expect(apiClient.delete).not.toHaveBeenCalled();
  });

  it('handles the undo action correctly', async () => {
    await act(async () => {
      renderComponent();
    });
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    const undoButtons = screen.getAllByText('Undo');
    await act(async () => {
      fireEvent.click(undoButtons[0]);
    });
    
    expect(apiClient.post).toHaveBeenCalled();
    expect(apiClient.post.mock.calls[0][0]).toMatch(/\/api\/activity-logs\/\d+\/undo/);
  });

  it('handles error when fetching data', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    mockFetchPendingRequests.mockRejectedValueOnce(new Error('API error'));
    
    await act(async () => {
      renderComponent();
    });
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    expect(consoleErrorSpy).toHaveBeenCalled();
    
    consoleErrorSpy.mockRestore();
  });

  it('handles error when deleting log', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    apiClient.delete.mockRejectedValueOnce(new Error('Delete error'));
    
    await act(async () => {
      renderComponent();
    });
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    const deleteButtons = screen.getAllByText('Delete');
    await act(async () => {
      fireEvent.click(deleteButtons[0]);
    });
    
    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });
    
    const confirmButton = screen.getByText('Delete Permanently');
    await act(async () => {
      fireEvent.click(confirmButton);
    });
    
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(apiClient.delete).toHaveBeenCalledWith('/api/activity-logs/2');
    
    consoleErrorSpy.mockRestore();
  });

  it('handles error when undoing action', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    apiClient.post.mockRejectedValueOnce(new Error('Undo error'));
    
    await act(async () => {
      renderComponent();
    });
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    const undoButtons = screen.getAllByText('Undo');
    await act(async () => {
      fireEvent.click(undoButtons[0]);
    });
    
    expect(consoleErrorSpy).toHaveBeenCalled();
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
    
    expect(screen.getByText('Activity Log')).toBeInTheDocument();
  });

  it('tests API call for undo action', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    const undoButtons = screen.getAllByText('Undo');
    await act(async () => {
      fireEvent.click(undoButtons[0]);
    });
    
    expect(apiClient.post).toHaveBeenCalled();
  });
});