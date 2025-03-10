import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import EditEventDetails from '../edit-event-details';
import { apiClient } from '../../../api';

vi.mock('../../../api', () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));


const mockNavigate = vi.fn();
const mockParams = { society_id: '123', event_id: '456' };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
  };
});


const theme = createTheme();

describe('EditEventDetails Component', () => {
  
  const mockEventDetail = {
    id: 456,
    title: 'Annual Conference',
    description: 'Society annual conference with industry speakers',
    location: 'Main Hall',
    date: '2025-06-15',
    start_time: '14:00:00',
    duration: '03:00:00',
    status: 'Approved',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (apiClient.get as vi.Mock).mockResolvedValue({ data: mockEventDetail });
    (apiClient.patch as vi.Mock).mockResolvedValue({ data: { success: true } });
  });

  function renderComponent() {
    return render(
      <ThemeProvider theme={theme}>
        <MemoryRouter
          initialEntries={[
            `/president-page/${mockParams.society_id}/edit-event-details/${mockParams.event_id}`,
          ]}
        >
          <Routes>
            <Route
              path="/president-page/:society_id/edit-event-details/:event_id"
              element={<EditEventDetails />}
            />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    );
  }

  it('renders loading state initially', async () => {
   
    (apiClient.get as vi.Mock).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve({ data: mockEventDetail }), 300);
        })
    );

    renderComponent();

    
    expect(await screen.findByRole('progressbar')).toBeInTheDocument();

   
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });

  it('fetches and displays event details', async () => {
    renderComponent();

    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    expect(apiClient.get).toHaveBeenCalledWith('/api/event/456/manage');

    const textboxes = screen.getAllByRole('textbox');
    expect(textboxes[0]).toHaveValue('Annual Conference');
    expect(textboxes[1]).toHaveValue('Society annual conference with industry speakers');
    expect(textboxes[2]).toHaveValue('Main Hall');

    const dateInput = screen.getByLabelText(/date/i);
    const timeInput = screen.getByLabelText(/start time/i);
    const durationInput = textboxes[3];

    expect(dateInput).toHaveValue('2025-06-15');
    expect(timeInput).toHaveValue('14:00:00');
    expect(durationInput).toHaveValue('03:00:00');
  });

  it('handles event not found', async () => {
    (apiClient.get as vi.Mock).mockRejectedValueOnce(new Error('Event not found'));

    renderComponent();

   
    expect(await screen.findByText('Event not found.')).toBeInTheDocument();
    expect(screen.getByText('Go Back')).toBeInTheDocument();
  });

  it('submits changes successfully', async () => {
    renderComponent();

    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    const textboxes = screen.getAllByRole('textbox');
    const titleInput = textboxes[0];
    const locationInput = textboxes[2];

    await act(async () => {
      fireEvent.change(titleInput, { target: { value: 'Updated Conference Title' } });
      fireEvent.change(locationInput, { target: { value: 'Conference Room A' } });
    });

    const submitButton = screen.getByRole('button', { name: /submit changes/i });
    await act(async () => {
      fireEvent.click(submitButton);
    });

    
    expect(apiClient.patch).toHaveBeenCalledWith('/api/event/456/manage', {
      title: 'Updated Conference Title',
      description: 'Society annual conference with industry speakers',
      location: 'Conference Room A',
      date: '2025-06-15',
      start_time: '14:00:00',
      duration: '03:00:00',
    });

   
    expect(await screen.findByText(/Event update requested/i)).toBeInTheDocument();

    
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('handles submission error', async () => {
    (apiClient.patch as vi.Mock).mockRejectedValueOnce(new Error('Update failed'));

    renderComponent();

    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    
    const submitButton = screen.getByRole('button', { name: /submit changes/i });
    await act(async () => {
      fireEvent.click(submitButton);
    });

   
    expect(await screen.findByText(/Failed to submit update request/i)).toBeInTheDocument();

    
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('cancels editing and navigates back', async () => {
    renderComponent();

    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await act(async () => {
      fireEvent.click(cancelButton);
    });

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('validates required fields', async () => {
    renderComponent();

    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    const textboxes = screen.getAllByRole('textbox');
    const titleInput = textboxes[0];
    const locationInput = textboxes[2];

    await act(async () => {
      fireEvent.change(titleInput, { target: { value: '' } });
      fireEvent.change(locationInput, { target: { value: '' } });
    });

    
    expect(titleInput).toHaveAttribute('required');
    expect(locationInput).toHaveAttribute('required');
  });
});
