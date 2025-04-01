import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import RejectedEventsList from '../RejectedEventsList';
import { apiClient, apiPaths } from '../../../api';
import { SearchContext } from '../../../components/layout/SearchContext';

vi.mock('../../../api', () => ({
  apiClient: {
    get: vi.fn(),
    request: vi.fn().mockResolvedValue({}),
  },
  apiPaths: {
    EVENTS: {
      REJECTEDEVENTLIST: '/api/events/rejected'
    },
    USER: {
      DELETE: vi.fn().mockImplementation((type, id) => `/api/delete/${type}/${id}`)
    }
  }
}));

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

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../../stores/settings-store', () => ({
  useSettingsStore: vi.fn(() => ({
    drawer: false
  }))
}));

vi.mock('../../../theme/theme', () => ({
  tokens: vi.fn(() => ({
    blueAccent: {
      500: '#1976d2',
      700: '#1565c0'
    },
    greenAccent: {
      200: '#81c784'
    },
    primary: {
      400: '#f5f5f5'
    }
  }))
}));

vi.mock('../../../utils/mapper.ts', () => ({
  mapToEventRequestData: vi.fn(data => ({
    ...data,
    eventId: data.id || data.eventId
  }))
}));

vi.mock('../../../components/EventPreview', () => ({
  EventPreview: ({ open, onClose, eventData }) => (
    open ? <div data-testid="event-preview">{eventData.title}</div> : null
  )
}));

describe('EventListRejected Component', () => {
  const mockEvents = [
    {
      id: 1,
      title: 'Canceled Workshop',
      description: 'Workshop that was rejected',
      date: '2025-04-10',
      startTime: '10:00',
      duration: '2 hours',
      hostedBy: 'Computer Science Society',
      location: 'Building A, Room 101'
    },
    {
      id: 2,
      title: 'Rejected Conference',
      description: 'Conference that was rejected',
      date: '2025-04-15',
      startTime: '09:00',
      duration: '8 hours',
      hostedBy: 'Engineering Society',
      location: 'Main Hall'
    }
  ];

  let consoleErrorSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
    
    apiClient.get.mockResolvedValue({
      data: mockEvents
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  const setup = async (searchTerm = '', useDarkTheme = false) => {
    let renderResult;
    
    await act(async () => {
      renderResult = render(
        <SearchContext.Provider value={{ searchTerm, setSearchTerm: vi.fn() }}>
          <ThemeProvider theme={useDarkTheme ? darkTheme : theme}>
            <MemoryRouter initialEntries={['/admin/event-list-rejected']}>
              <Routes>
                <Route path="/admin/event-list-rejected" element={<RejectedEventsList />} />
              </Routes>
            </MemoryRouter>
          </ThemeProvider>
        </SearchContext.Provider>
      );
    });
    
    return renderResult;
  };

  it('renders the data grid with rejected events', async () => {
    await setup();
    
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/events/rejected');
    });
    
    expect(await screen.findByRole('columnheader', { name: /title/i })).toBeInTheDocument();
    expect(await screen.findByRole('columnheader', { name: /date/i })).toBeInTheDocument();
    expect(await screen.findByRole('columnheader', { name: /actions/i })).toBeInTheDocument();
  });

  it('filters events based on search term', async () => {
    await setup('Conference');
    
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/events/rejected');
    });
    
    const viewButtons = await screen.findAllByRole('button', { name: /view/i });
    expect(viewButtons.length).toBeGreaterThan(0);
  });

  it('handles API fetch error gracefully', async () => {
    apiClient.get.mockRejectedValueOnce(new Error('Failed to fetch events'));
    
    await setup();
    
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/events/rejected');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  it('renders correctly with dark theme', async () => {
    await setup('', true);
    
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/events/rejected');
    });
    
    const viewButtons = await screen.findAllByRole('button', { name: /view/i });
    expect(viewButtons.length).toBeGreaterThan(0);
  });

  it('opens event preview when view button is clicked', async () => {
    await setup();
    
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/events/rejected');
    });
    
    const viewButtons = await screen.findAllByRole('button', { name: /view/i });
    fireEvent.click(viewButtons[0]);
    
    expect(await screen.findByTestId('event-preview')).toBeInTheDocument();
  });

  it('opens delete dialog and handles delete confirmation', async () => {
    await setup();
    
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/events/rejected');
    });
    
    const deleteButtons = await screen.findAllByRole('button', { name: /delete/i });
    fireEvent.click(deleteButtons[0]);
    
    expect(screen.getByText(/confirm deletion/i)).toBeInTheDocument();
    
    const reasonInput = screen.getByLabelText(/reason for deletion/i);
    fireEvent.change(reasonInput, { target: { value: 'Testing deletion' } });
    
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(apiClient.request).toHaveBeenCalled();
      expect(apiClient.get).toHaveBeenCalledTimes(2);
    });
  });
});