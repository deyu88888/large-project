import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material';
import AdminEventList from '../AdminEventList';
import { apiClient, apiPaths } from '../../../api';
import { SearchContext } from '../../../components/layout/SearchContext';
import { useSettingsStore } from '../../../stores/settings-store';
import { EventPreview } from '../../../components/EventPreview';

vi.mock('../../../api', () => ({
  apiClient: {
    get: vi.fn(),
    request: vi.fn(),
  },
  apiPaths: {
    EVENTS: {
      APPROVEDEVENTLIST: '/api/events/approved',
    },
    USER: {
      DELETE: vi.fn().mockImplementation((type, id) => `/api/user/delete/${type}/${id}`),
    },
  },
}));

vi.mock('../../../stores/settings-store', () => ({
  useSettingsStore: vi.fn(),
}));

vi.mock('../../../components/EventPreview', () => ({
  EventPreview: vi.fn().mockReturnValue(<div data-testid="event-preview" />),
}));

vi.mock('../../../utils/mapper.ts', () => ({
  mapToEventRequestData: vi.fn().mockImplementation((event) => ({
    ...event,
  })),
}));

const mockEvents = [
  {
    eventId: '1',
    title: 'Test Event 1',
    date: '2025-04-10',
    startTime: '14:00',
    duration: '2 hours',
    hostedBy: 'Test Host',
    location: 'Test Location',
    description: 'Test Description',
  },
  {
    eventId: '2',
    title: 'Another Event',
    date: '2025-04-15',
    startTime: '10:00',
    duration: '1.5 hours',
    hostedBy: 'Another Host',
    location: 'Another Location',
    description: 'Another Description',
  },
];

const renderAdminEventList = (options = { searchTerm: '', drawer: true }) => {
  const theme = createTheme({
    palette: {
      mode: 'light',
    },
  });

  vi.mocked(useSettingsStore).mockReturnValue({
    drawer: options.drawer,
  });

  return render(
    <ThemeProvider theme={theme}>
      <SearchContext.Provider value={{ searchTerm: options.searchTerm, setSearchTerm: vi.fn() }}>
        <AdminEventList />
      </SearchContext.Provider>
    </ThemeProvider>
  );
};

describe('AdminEventList Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.get).mockResolvedValue({
      data: mockEvents,
    });
  });

  it('renders the component with loading state initially', async () => {
    renderAdminEventList();
    const loadingElement = screen.getByRole('progressbar');
    expect(loadingElement).toBeInTheDocument();
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith(apiPaths.EVENTS.APPROVEDEVENTLIST);
    });
  });

  it('displays events after loading', async () => {
    renderAdminEventList();
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith(apiPaths.EVENTS.APPROVEDEVENTLIST);
    });
    await waitFor(() => {
      expect(screen.getByText('Test Event 1')).toBeInTheDocument();
      expect(screen.getByText('Another Event')).toBeInTheDocument();
    });
  });

  it('filters events based on search term', async () => {
    renderAdminEventList({ searchTerm: 'another', drawer: true });
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith(apiPaths.EVENTS.APPROVEDEVENTLIST);
    });
    await waitFor(() => {
      expect(screen.queryByText('Test Event 1')).not.toBeInTheDocument();
      expect(screen.getByText('Another Event')).toBeInTheDocument();
    });
  });

  it('handles API error when fetching events', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce({
      response: {
        data: {
          message: 'Failed to fetch events',
        },
      },
    });
    renderAdminEventList();
    await waitFor(() => {
      expect(screen.getByText('Failed to load events: Failed to fetch events')).toBeInTheDocument();
    });
  });

  it('opens event preview when View button is clicked', async () => {
    const user = userEvent.setup();
    renderAdminEventList();
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith(apiPaths.EVENTS.APPROVEDEVENTLIST);
    });
    const viewButtons = await screen.findAllByText('View');
    await user.click(viewButtons[0]);
    expect(EventPreview).toHaveBeenCalledWith(
      expect.objectContaining({
        open: true,
        eventData: expect.objectContaining({ eventId: '1' }),
      }),
      expect.anything()
    );
  });

  it('opens delete dialog when Delete button is clicked', async () => {
    const user = userEvent.setup();
    renderAdminEventList();
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith(apiPaths.EVENTS.APPROVEDEVENTLIST);
    });
    const deleteButtons = await screen.findAllByText('Delete');
    await user.click(deleteButtons[0]);
    expect(screen.getByText('Please confirm that you would like to delete Test Event 1.')).toBeInTheDocument();
  });

  it('disables confirm button in delete dialog when reason is empty', async () => {
    const user = userEvent.setup();
    renderAdminEventList();
    await waitFor(() => expect(apiClient.get).toHaveBeenCalled());
    const deleteButtons = await screen.findAllByText('Delete');
    await user.click(deleteButtons[0]);
    const confirmButton = screen.getByRole('button', { name: 'Confirm' });
    expect(confirmButton).toBeDisabled();
    const reasonInput = screen.getByRole('textbox');
    await user.type(reasonInput, 'Test reason');
    expect(confirmButton).not.toBeDisabled();
  });

  it('handles successful event deletion', async () => {
    const user = userEvent.setup();
    vi.mocked(apiClient.request).mockImplementationOnce(() => 
      new Promise(resolve => {
        setTimeout(() => resolve({}), 10);
      })
    );
    renderAdminEventList();
    await waitFor(() => expect(apiClient.get).toHaveBeenCalled());
    const deleteButtons = await screen.findAllByText('Delete');
    await user.click(deleteButtons[0]);
    const reasonInput = screen.getByRole('textbox');
    await user.type(reasonInput, 'Test reason');
    const confirmButton = screen.getByRole('button', { name: 'Confirm' });
    expect(confirmButton).not.toBeDisabled();
    await user.click(confirmButton);
    expect(apiClient.request).toHaveBeenCalledWith({
      method: 'DELETE',
      url: '/api/user/delete/event/1',
      data: { reason: 'Test reason' },
    });
    await waitFor(() => {
      expect(screen.getByText(/Event ".*" was successfully deleted./)).toBeInTheDocument();
    });
    expect(apiClient.get).toHaveBeenCalledTimes(2);
  });

  it('handles error when deleting an event', async () => {
    const user = userEvent.setup();
    vi.mocked(apiClient.request).mockRejectedValueOnce({
      response: {
        data: {
          error: 'Permission denied',
        },
      },
    });
    renderAdminEventList();
    await waitFor(() => expect(apiClient.get).toHaveBeenCalled());
    const deleteButtons = await screen.findAllByText('Delete');
    await user.click(deleteButtons[0]);
    const reasonInput = screen.getByRole('textbox');
    await user.type(reasonInput, 'Test reason');
    const confirmButton = screen.getByRole('button', { name: 'Confirm' });
    await user.click(confirmButton);
    await waitFor(() => {
      expect(screen.getByText('Failed to delete event: Permission denied')).toBeInTheDocument();
    });
  });

  it('closes the delete dialog when Cancel is clicked', async () => {
    const user = userEvent.setup();
    renderAdminEventList();
    await waitFor(() => expect(apiClient.get).toHaveBeenCalled());
    const deleteButtons = await screen.findAllByText('Delete');
    await user.click(deleteButtons[0]);
    expect(screen.getByText('Please confirm that you would like to delete Test Event 1.')).toBeInTheDocument();
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await user.click(cancelButton);
    await waitFor(() => {
      expect(screen.queryByText('Please confirm that you would like to delete Test Event 1.')).not.toBeInTheDocument();
    });
  });

  it('closes event preview when close handler is called', async () => {
    const user = userEvent.setup();
    renderAdminEventList();
    await waitFor(() => expect(apiClient.get).toHaveBeenCalled());
    const viewButtons = await screen.findAllByText('View');
    await user.click(viewButtons[0]);
    const { onClose } = vi.mocked(EventPreview).mock.calls[0][0];
    act(() => {
      onClose();
    });
    const calls = vi.mocked(EventPreview).mock.calls;
    const lastCall = calls[calls.length - 1];
    expect(lastCall[0].open).toBe(false);
  });

  it('handles notification display', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce({
      response: {
        data: {
          message: 'Failed to fetch events',
        },
      },
    });
    renderAdminEventList();
    await waitFor(() => {
      expect(screen.getByText('Failed to load events: Failed to fetch events')).toBeInTheDocument();
    });
  });

  it('renders with drawer open style', () => {
    vi.mocked(useSettingsStore).mockReturnValue({
      drawer: true,
    });
    const { container } = renderAdminEventList({ drawer: true });
    const containerElement = container.firstChild;
    expect(containerElement).toHaveStyle('max-width: calc(100% - 3px)');
  });
  
  it('renders with drawer closed style', () => {
    vi.mocked(useSettingsStore).mockReturnValue({
      drawer: false,
    });
    const { container } = renderAdminEventList({ drawer: false });
    const containerElement = container.firstChild;
    expect(containerElement).toHaveStyle('max-width: 100%');
  });
  
  it('verifies that submit is disabled with empty reason', async () => {
    const user = userEvent.setup();
    const mockApiRequest = vi.mocked(apiClient.request);
    renderAdminEventList();
    await waitFor(() => expect(apiClient.get).toHaveBeenCalled());
    const deleteButtons = await screen.findAllByText('Delete');
    await user.click(deleteButtons[0]);
    const confirmButton = screen.getByRole('button', { name: 'Confirm' });
    expect(confirmButton).toBeDisabled();
    expect(mockApiRequest).not.toHaveBeenCalled();
  });
  
  it('handles events with null values', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: [
        {
          eventId: '1',
          title: 'Test Event 1',
          date: null,
          startTime: '14:00',
          duration: null,
          hostedBy: 'Test Host',
          location: null,
          description: 'Test Description',
        }
      ],
    });
    renderAdminEventList();
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith(apiPaths.EVENTS.APPROVEDEVENTLIST);
    });
    expect(screen.getByRole('grid')).toBeInTheDocument();
    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });
});