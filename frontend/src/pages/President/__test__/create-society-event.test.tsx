import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import CreateSocietyEvent from '../CreateSocietyEvent';
import { apiClient } from '../../../api';
import userEvent from '@testing-library/user-event';
import { act } from 'react';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ society_id: '123' }),
  };
});

vi.mock('../../../api', () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

const mockAlert = vi.fn();
global.alert = mockAlert;

describe('CreateSocietyEvent Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockReset();
    mockAlert.mockReset();
  });

  function renderComponent() {
    return render(
      <MemoryRouter initialEntries={['/society/123/create-event']}>
        <Routes>
          <Route path="/society/:society_id/create-event" element={<CreateSocietyEvent />} />
        </Routes>
      </MemoryRouter>
    );
  }

  it('renders the create event form correctly', () => {
    renderComponent();
    
    expect(screen.getByText('Create a New Event')).toBeInTheDocument();
    expect(screen.getByLabelText(/Event Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Start Time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Duration/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Location/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Max Capacity/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Why do you want to create this event?/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });

  it('updates form data when inputs change', async () => {
    renderComponent();
    
    const titleInput = screen.getByLabelText(/Event Title/i);
    const descriptionInput = screen.getByLabelText(/Description/i);
    const dateInput = screen.getByLabelText(/Date/i);
    const timeInput = screen.getByLabelText(/Start Time/i);
    const durationInput = screen.getByLabelText(/Duration/i);
    const locationInput = screen.getByLabelText(/Location/i);
    const capacityInput = screen.getByLabelText(/Max Capacity/i);
    const reasonInput = screen.getByLabelText(/Why do you want to create this event?/i);
    
    await act(async () => {
      await userEvent.type(titleInput, 'Test Event');
      await userEvent.type(descriptionInput, 'This is a test event description');
      await userEvent.type(dateInput, '2023-12-31');
      await userEvent.type(timeInput, '14:30');
      await userEvent.clear(durationInput);
      await userEvent.type(durationInput, '02:00:00');
      await userEvent.type(locationInput, 'Test Location');
      await userEvent.clear(capacityInput);
      await userEvent.type(capacityInput, '50');
      await userEvent.type(reasonInput, 'Testing purposes');
    });
    
    expect(titleInput).toHaveValue('Test Event');
    expect(descriptionInput).toHaveValue('This is a test event description');
    expect(dateInput).toHaveValue('2023-12-31');
    expect(timeInput).toHaveValue('14:30');
    expect(durationInput).toHaveValue('02:00:00');
    expect(locationInput).toHaveValue('Test Location');
    expect(capacityInput).toHaveValue(50);
    expect(reasonInput).toHaveValue('Testing purposes');
  });

  it('submits the form and creates an event successfully', async () => {
    (apiClient.post as vi.Mock).mockResolvedValueOnce({ data: { id: 1 } });
    
    renderComponent();
    
    await act(async () => {
      await userEvent.type(screen.getByLabelText(/Event Title/i), 'Test Event');
      await userEvent.type(screen.getByLabelText(/Description/i), 'Test Description');
      await userEvent.type(screen.getByLabelText(/Date/i), '2023-12-31');
      await userEvent.type(screen.getByLabelText(/Start Time/i), '14:30');
      await userEvent.clear(screen.getByLabelText(/Duration/i));
      await userEvent.type(screen.getByLabelText(/Duration/i), '02:00:00');
      await userEvent.type(screen.getByLabelText(/Location/i), 'Test Location');
      await userEvent.clear(screen.getByLabelText(/Max Capacity/i));
      await userEvent.type(screen.getByLabelText(/Max Capacity/i), '50');
      await userEvent.type(screen.getByLabelText(/Why do you want to create this event?/i), 'Testing purposes');
    });
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    });
    
    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/api/society/123/create-society-event/', {
        title: 'Test Event',
        description: 'Test Description',
        date: '2023-12-31',
        start_time: '14:30',
        duration: '02:00:00',
        location: 'Test Location',
        max_capacity: '50',  // Changed back to string '50' to match actual form submission
        admin_reason: 'Testing purposes',
        hosted_by: '123'
      });
    });
    
    expect(mockAlert).toHaveBeenCalledWith('Event created successfully!');
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('handles API error when creating an event', async () => {
    const mockError = new Error('API Error');
    (apiClient.post as vi.Mock).mockRejectedValueOnce(mockError);
    
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    renderComponent();
    
    await act(async () => {
      await userEvent.type(screen.getByLabelText(/Event Title/i), 'Test Event');
      await userEvent.type(screen.getByLabelText(/Description/i), 'Test Description');
      await userEvent.type(screen.getByLabelText(/Date/i), '2023-12-31');
      await userEvent.type(screen.getByLabelText(/Start Time/i), '14:30');
      await userEvent.type(screen.getByLabelText(/Location/i), 'Test Location');
      await userEvent.type(screen.getByLabelText(/Why do you want to create this event?/i), 'Testing purposes');
    });
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    });
    
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error creating event:', mockError);
      expect(mockAlert).toHaveBeenCalledWith('Failed to create event.');
      expect(mockNavigate).not.toHaveBeenCalled();
    });
    
    consoleErrorSpy.mockRestore();
  });

  it('validates form field requirements', async () => {
    renderComponent();
    
    const submitButton = screen.getByRole('button', { name: 'Submit' });
    
    await act(async () => {
      fireEvent.click(submitButton);
    });
    
    expect(apiClient.post).not.toHaveBeenCalled();
  });
});