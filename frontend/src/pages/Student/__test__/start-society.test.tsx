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

const lightTheme = createTheme({
  palette: { mode: 'light' },
});
const darkTheme = createTheme({
  palette: { mode: 'dark' },
});

describe('StartSociety', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  const renderComponent = (theme = lightTheme) =>
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

  it('shows an error when only society name is provided', async () => {
    renderComponent();
    const nameInput = screen.getByLabelText(/Society Name/i) as HTMLInputElement;
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'Test Society' } });
    });
    await act(async () => {
      fireEvent.submit(screen.getByRole('button', { name: /Submit Request/i }));
    });
    expect(screen.getByText(/Please fill out all fields./i)).toBeInTheDocument();
  });

  it('shows an error when only description is provided', async () => {
    renderComponent();
    const descriptionInput = screen.getByLabelText(/Description/i) as HTMLTextAreaElement;
    await act(async () => {
      fireEvent.change(descriptionInput, { target: { value: 'Test description' } });
    });
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
      expect(
        screen.getByText(/Society creation request submitted successfully!/i)
      ).toBeInTheDocument()
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
      expect(
        screen.getByText(/Failed to create society. Please try again later./i)
      ).toBeInTheDocument()
    );
  });

  it('renders correctly in dark mode', () => {
    renderComponent(darkTheme);
    expect(screen.getByText(/Start a Society/i)).toBeInTheDocument();
  });

  it('allows submitting a new request after success', async () => {
    (axios.post as vi.Mock).mockResolvedValueOnce({ status: 201 });
    renderComponent();
    const nameInput = screen.getByLabelText(/Society Name/i) as HTMLInputElement;
    const descriptionInput = screen.getByLabelText(/Description/i) as HTMLTextAreaElement;
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'First Society' } });
      fireEvent.change(descriptionInput, { target: { value: 'First description' } });
      fireEvent.submit(screen.getByRole('button', { name: /Submit Request/i }));
    });
    await waitFor(() =>
      expect(
        screen.getByText(/Society creation request submitted successfully!/i)
      ).toBeInTheDocument()
    );
    (axios.post as vi.Mock).mockResolvedValueOnce({ status: 201 });
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'Second Society' } });
      fireEvent.change(descriptionInput, { target: { value: 'Second description' } });
      fireEvent.submit(screen.getByRole('button', { name: /Submit Request/i }));
    });
    await waitFor(() =>
      expect(
        screen.getByText(/Society creation request submitted successfully!/i)
      ).toBeInTheDocument()
    );
    expect(axios.post).toHaveBeenCalledTimes(2);
    expect(axios.post).toHaveBeenNthCalledWith(2, "/api/start-society/", {
      name: "Second Society",
      description: "Second description",
    });
  });

  it('clears error message when form is submitted successfully after an error', async () => {
    renderComponent();
    await act(async () => {
      fireEvent.submit(screen.getByRole('button', { name: /Submit Request/i }));
    });
    expect(screen.getByText(/Please fill out all fields./i)).toBeInTheDocument();
    (axios.post as vi.Mock).mockResolvedValueOnce({ status: 201 });
    const nameInput = screen.getByLabelText(/Society Name/i) as HTMLInputElement;
    const descriptionInput = screen.getByLabelText(/Description/i) as HTMLTextAreaElement;
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'Test Society' } });
      fireEvent.change(descriptionInput, { target: { value: 'Test description' } });
      fireEvent.submit(screen.getByRole('button', { name: /Submit Request/i }));
    });
    await waitFor(() => {
      expect(screen.queryByText(/Please fill out all fields./i)).not.toBeInTheDocument();
      expect(
        screen.getByText(/Society creation request submitted successfully!/i)
      ).toBeInTheDocument();
    });
  });

  it('clears success message when form submission fails after a success', async () => {
    (axios.post as vi.Mock).mockResolvedValueOnce({ status: 201 });
    renderComponent();
    const nameInput = screen.getByLabelText(/Society Name/i) as HTMLInputElement;
    const descriptionInput = screen.getByLabelText(/Description/i) as HTMLTextAreaElement;
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'Test Society' } });
      fireEvent.change(descriptionInput, { target: { value: 'Test description' } });
      fireEvent.submit(screen.getByRole('button', { name: /Submit Request/i }));
    });
    await waitFor(() =>
      expect(
        screen.getByText(/Society creation request submitted successfully!/i)
      ).toBeInTheDocument()
    );
    (axios.post as vi.Mock).mockResolvedValueOnce({ status: 400 });
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'Another Society' } });
      fireEvent.change(descriptionInput, { target: { value: 'Another description' } });
      fireEvent.submit(screen.getByRole('button', { name: /Submit Request/i }));
    });
    await waitFor(() => {
      expect(
        screen.queryByText(/Society creation request submitted successfully!/i)
      ).not.toBeInTheDocument();
      expect(screen.getByText(/Something went wrong. Please try again./i)).toBeInTheDocument();
    });
  });

  it('handles axios error with response data correctly', async () => {
    const consoleSpy = vi.spyOn(console, 'error');
    const errorWithResponse = {
      response: {
        data: { message: 'Society name already exists' },
      },
    };
    (axios.post as vi.Mock).mockRejectedValueOnce(errorWithResponse);
    renderComponent();
    const nameInput = screen.getByLabelText(/Society Name/i) as HTMLInputElement;
    const descriptionInput = screen.getByLabelText(/Description/i) as HTMLTextAreaElement;
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'Test Society' } });
      fireEvent.change(descriptionInput, { target: { value: 'Test description' } });
      fireEvent.submit(screen.getByRole('button', { name: /Submit Request/i }));
    });
    await waitFor(() => {
      expect(
        screen.getByText(/Failed to create society. Please try again later./i)
      ).toBeInTheDocument();
    });
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('handles different types of axios errors correctly', async () => {
    const errorWithStatusCode = {
      response: {
        status: 403,
        data: { error: 'Permission denied' },
      },
    };
    const consoleSpy = vi.spyOn(console, 'error');
    (axios.post as vi.Mock).mockRejectedValueOnce(errorWithStatusCode);
    renderComponent();
    const nameInput = screen.getByLabelText(/Society Name/i) as HTMLInputElement;
    const descriptionInput = screen.getByLabelText(/Description/i) as HTMLTextAreaElement;
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'Test Society' } });
      fireEvent.change(descriptionInput, { target: { value: 'Test description' } });
      fireEvent.submit(screen.getByRole('button', { name: /Submit Request/i }));
    });
    await waitFor(() => {
      expect(
        screen.getByText(/Failed to create society. Please try again later./i)
      ).toBeInTheDocument();
    });
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
