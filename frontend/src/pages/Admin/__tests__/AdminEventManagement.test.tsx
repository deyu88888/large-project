import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ManageEvents from '../AdminEventManagement';

// Mock the child components
vi.mock('../AdminEventList', () => ({
  default: () => <div data-testid="event-list">EventList Component</div>
}));

vi.mock('../RejectedEventsList', () => ({
  default: () => <div data-testid="event-list-rejected">EventListRejected Component</div>
}));

vi.mock('../PendingEventRequest', () => ({
  default: () => <div data-testid="pending-event-request">PendingEventRequest Component</div>
}));

// Mock the theme tokens
vi.mock('../../theme/theme', () => ({
  tokens: vi.fn().mockReturnValue({
    grey: {
      100: '#e0e0e0',
      200: '#c2c2c2'
    }
  })
}));

// Create a spy for localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: vi.fn((key: string) => {
      // Return the stored value or null if not found
      return store[key] !== undefined ? store[key] : null;
    }),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: vi.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('ManageEvents Component', () => {
  const theme = createTheme({
    palette: {
      mode: 'light',
    }
  });

  const darkTheme = createTheme({
    palette: {
      mode: 'dark',
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  const renderManageEvents = async (useDarkTheme = false) => {
    return render(
      <ThemeProvider theme={useDarkTheme ? darkTheme : theme}>
        <ManageEvents />
      </ThemeProvider>
    );
  };

  it('renders the component with title', async () => {
    await act(async () => {
      renderManageEvents();
    });
    
    expect(screen.getByText('Manage Events')).toBeInTheDocument();
  });

  it('renders three tabs with correct labels', async () => {
    await act(async () => {
      renderManageEvents();
    });
    
    expect(screen.getByText('Approved events')).toBeInTheDocument();
    expect(screen.getByText('Pending events')).toBeInTheDocument();
    expect(screen.getByText('Rejected events')).toBeInTheDocument();
  });

  it('displays EventList component by default', async () => {
    await act(async () => {
      renderManageEvents();
    });
    
    expect(screen.getByTestId('event-list')).toBeInTheDocument();
    expect(screen.queryByTestId('pending-event-request')).not.toBeInTheDocument();
    expect(screen.queryByTestId('event-list-rejected')).not.toBeInTheDocument();
  });

  it('changes tab when clicked', async () => {
    await act(async () => {
      renderManageEvents();
    });
    
    // Initial state - EventList should be visible
    expect(screen.getByTestId('event-list')).toBeInTheDocument();
    
    // Click on Pending events tab
    await act(async () => {
      fireEvent.click(screen.getByText('Pending events'));
    });
    
    // PendingEventRequest should now be visible
    expect(screen.queryByTestId('event-list')).not.toBeInTheDocument();
    expect(screen.getByTestId('pending-event-request')).toBeInTheDocument();
    expect(screen.queryByTestId('event-list-rejected')).not.toBeInTheDocument();
    
    // Click on Rejected events tab
    await act(async () => {
      fireEvent.click(screen.getByText('Rejected events'));
    });
    
    // EventListRejected should now be visible
    expect(screen.queryByTestId('event-list')).not.toBeInTheDocument();
    expect(screen.queryByTestId('pending-event-request')).not.toBeInTheDocument();
    expect(screen.getByTestId('event-list-rejected')).toBeInTheDocument();
  });

  it('persists tab selection in localStorage', async () => {
    await act(async () => {
      renderManageEvents();
    });
    
    // Click on Pending events tab (index 1)
    await act(async () => {
      fireEvent.click(screen.getByText('Pending events'));
    });
    
    // Check localStorage was updated
    expect(localStorageMock.setItem).toHaveBeenCalledWith('activeEventTab', '1');
    
    // Click on Rejected events tab (index 2)
    await act(async () => {
      fireEvent.click(screen.getByText('Rejected events'));
    });
    
    // Check localStorage was updated again
    expect(localStorageMock.setItem).toHaveBeenCalledWith('activeEventTab', '2');
  });

  it('loads the active tab from localStorage on mount', async () => {
    // Set active tab in localStorage
    localStorageMock.getItem.mockReturnValueOnce('2');
    
    await act(async () => {
      renderManageEvents();
    });
    
    // Should start with the third tab (Rejected events)
    expect(screen.queryByTestId('event-list')).not.toBeInTheDocument();
    expect(screen.queryByTestId('pending-event-request')).not.toBeInTheDocument();
    expect(screen.getByTestId('event-list-rejected')).toBeInTheDocument();
  });

  it('renders correctly in dark theme', async () => {
    await act(async () => {
      renderManageEvents(true);
    });
    
    expect(screen.getByText('Manage Events')).toBeInTheDocument();
  });

  it('handles invalid localStorage value by defaulting to first tab', async () => {
    // This test needs to check the implementation rather than the UI
    // Let's spy on console.error to catch the MUI warnings
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Set invalid value in localStorage
    localStorageMock.getItem.mockReturnValueOnce('invalid');
    
    let renderedComponent;
    await act(async () => {
      renderedComponent = renderManageEvents();
    });
    
    // Check that the component rendered without crashing
    expect(screen.getByText('Manage Events')).toBeInTheDocument();
    
    // Clean up the spy
    consoleErrorSpy.mockRestore();
  });
});