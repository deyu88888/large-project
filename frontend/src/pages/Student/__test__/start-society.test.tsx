import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import StartSociety from '../start-society';
import axios from 'axios';

vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const theme = createTheme();

describe('StartSociety', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () =>
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <StartSociety />
        </MemoryRouter>
      </ThemeProvider>
    );

  it('renders the form correctly', () => {
    renderComponent();
    expect(screen.getByText(/Start a Society/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Society Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Submit Request/i })).toBeInTheDocument();
  });

  it('shows an error when form is submitted with empty fields', async () => {
    renderComponent();
    await act(async () => {
      fireEvent.submit(screen.getByRole('button', { name: /Submit Request/i }));
    });
    expect(screen.getByText(/Please fill out all fields./i)).toBeInTheDocument();
  });

  it('submits the form successfully and clears fields on a 201 response', async () => {
    (axios.post as vi.Mock).mockResolvedValueOnce({ status: 201 });
    renderComponent();

    const nameInput = screen.getByLabelText(/Society Name/i) as HTMLInputElement;
    const descriptionInput = screen.getByLabelText(/Description/i) as HTMLTextAreaElement;
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'New Society' } });
      fireEvent.change(descriptionInput, { target: { value: 'A new society description' } });
    });
    await act(async () => {
      fireEvent.submit(screen.getByRole('button', { name: /Submit Request/i }));
    });
    await waitFor(() =>
      expect(screen.getByText(/Society creation request submitted successfully!/i)).toBeInTheDocument()
    );
    expect(nameInput.value).toBe('');
    expect(descriptionInput.value).toBe('');
  });

  it('shows an error message when submission returns a non-201 response', async () => {
    (axios.post as vi.Mock).mockResolvedValueOnce({ status: 400 });
    renderComponent();

    const nameInput = screen.getByLabelText(/Society Name/i) as HTMLInputElement;
    const descriptionInput = screen.getByLabelText(/Description/i) as HTMLTextAreaElement;
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'Test Society' } });
      fireEvent.change(descriptionInput, { target: { value: 'Test description' } });
    });
    await act(async () => {
      fireEvent.submit(screen.getByRole('button', { name: /Submit Request/i }));
    });
    await waitFor(() =>
      expect(screen.getByText(/Something went wrong. Please try again./i)).toBeInTheDocument()
    );
  });

  it('shows an error message when axios.post fails', async () => {
    (axios.post as vi.Mock).mockRejectedValueOnce(new Error('Network error'));
    renderComponent();

    const nameInput = screen.getByLabelText(/Society Name/i) as HTMLInputElement;
    const descriptionInput = screen.getByLabelText(/Description/i) as HTMLTextAreaElement;
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'Test Society' } });
      fireEvent.change(descriptionInput, { target: { value: 'Test description' } });
    });
    await act(async () => {
      fireEvent.submit(screen.getByRole('button', { name: /Submit Request/i }));
    });
    await waitFor(() =>
      expect(screen.getByText(/Failed to create society. Please try again later./i)).toBeInTheDocument()
    );
  });
});
