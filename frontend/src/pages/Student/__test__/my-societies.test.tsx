import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import MySocieties from '../MyJoinedSocieties';
import { apiClient } from '../../../api';

vi.mock('../../../api', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('MySocieties', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (apiClient.get as vi.Mock).mockImplementation((url: string) => {
      if (url === '/api/student-societies') {
        return Promise.resolve({
          data: [
            { id: 1, name: 'Science Club', description: 'A club about science.' },
            { id: 2, name: 'Art Club', description: 'Explore your creativity.' },
          ],
        });
      }
      return Promise.resolve({ data: [] });
    });
  });

  const renderComponent = (mode = 'light') => {
    const theme = createTheme({
      palette: {
        mode: mode as 'light' | 'dark',
      },
    });
    return render(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <MySocieties />
        </MemoryRouter>
      </ThemeProvider>
    );
  };

  it('displays a loading message initially', async () => {
    renderComponent();
    expect(screen.getByText(/Loading societies.../i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/My Societies/i)).toBeInTheDocument());
  });

  it('renders societies when API returns data', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText(/My Societies/i)).toBeInTheDocument());
    expect(screen.getByText('Science Club')).toBeInTheDocument();
    expect(screen.getByText('A club about science.')).toBeInTheDocument();
    expect(screen.getByText('Art Club')).toBeInTheDocument();
    expect(screen.getByText('Explore your creativity.')).toBeInTheDocument();
  });

  it('renders empty state when no societies are returned', async () => {
    (apiClient.get as vi.Mock).mockResolvedValueOnce({ data: [] });
    renderComponent();
    await waitFor(() => expect(screen.getByText(/My Societies/i)).toBeInTheDocument());
    expect(screen.getByText(/You haven't joined any societies yet/i)).toBeInTheDocument();
  });

  it('logs an error and shows empty state when API call fails', async () => {
    const errorMessage = 'Network Error';
    (apiClient.get as vi.Mock).mockResolvedValueOnce(Promise.reject(new Error(errorMessage)));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderComponent();
    await waitFor(() => expect(screen.getByText(/My Societies/i)).toBeInTheDocument());
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching societies:', expect.any(Error));
    expect(screen.getByText(/You haven't joined any societies yet/i)).toBeInTheDocument();
    consoleErrorSpy.mockRestore();
  });

  it('renders correctly in dark mode', async () => {
    renderComponent('dark');
    await waitFor(() => expect(screen.getByText(/My Societies/i)).toBeInTheDocument());
    expect(screen.getByText('Science Club')).toBeInTheDocument();
    expect(screen.getByText('A club about science.')).toBeInTheDocument();
  });
});
