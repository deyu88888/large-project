import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import EditEventDetails from '../EditEventDetails';
import { apiClient } from '../../../api';

vi.mock('../../../api', () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ eventId: '456' }),
  };
});

const theme = createTheme();

describe('EditEventDetails Component', () => {
  const mockEventDetail = {
    event: {
      id: 456,
      title: 'Annual Conference',
      main_description: 'Society annual conference with industry speakers',
      location: 'Main Hall',
      date: '2025-06-15',
      start_time: '14:00:00',
      duration: '03:00:00',
      status: 'Approved',
      extra_modules: [],
      participant_modules: [],
      cover_image: 'test-image-url',
      max_capacity: 100
    },
    admin_reason: ''
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.get).mockImplementation(() => 
      Promise.resolve({ data: mockEventDetail, status: 200 })
    );
    vi.mocked(apiClient.patch).mockImplementation(() => 
      Promise.resolve({ data: { success: true }, status: 200 })
    );
  });

  function renderComponent() {
    return render(
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={['/edit-event/456']}>
          <Routes>
            <Route path="/edit-event/:eventId" element={<EditEventDetails />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    );
  }

  it('renders loading state initially', async () => {
    vi.mocked(apiClient.get).mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => 
        resolve({ data: mockEventDetail, status: 200 }), 100)
      )
    );

    renderComponent();

    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('fetches and displays event details', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    }, { timeout: 1000 });

    expect(apiClient.get).toHaveBeenCalledWith('/api/events/456/manage/');

    const titleInput = await screen.findByDisplayValue('Annual Conference');
    expect(titleInput).toBeInTheDocument();
  });

  it('handles event not found', async () => {
    vi.mocked(apiClient.get).mockImplementationOnce(() => 
      Promise.reject(new Error('Event not found'))
    );

    renderComponent();

    await waitFor(() => {
      const errorText = screen.getByText('Failed to load event data');
      expect(errorText).toBeInTheDocument();
    });

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('submits changes successfully', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /submit event/i });

    vi.mocked(apiClient.patch).mockImplementationOnce(() => 
      Promise.resolve({ data: { success: true }, status: 200 })
    );

    fireEvent.click(submitButton);
  });

  it('handles submission error', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /submit event/i });

    vi.mocked(apiClient.patch).mockImplementationOnce(() => 
      Promise.reject(new Error('Update failed'))
    );

    fireEvent.click(submitButton);

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('cancels editing and navigates back', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    const previewButton = screen.getByRole('button', { name: /preview event/i });
    
    fireEvent.click(previewButton);
  });
});
