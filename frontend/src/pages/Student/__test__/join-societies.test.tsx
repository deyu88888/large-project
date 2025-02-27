import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import JoinSocieties from '../join-societies';
import { apiClient } from '../../../api';

vi.mock('../../../api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const theme = createTheme();

describe('JoinSocieties Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (apiClient.get as vi.Mock).mockImplementation((url: string) => {
      if (url === '/api/join-society/') {
        return Promise.resolve({
          data: [
            {
              id: 1,
              name: 'Photography Club',
              description: 'A club for photography enthusiasts',
            },
            {
              id: 2,
              name: 'Chess Club',
              description: 'Challenge your mind with chess!',
            },
          ],
        });
      }
      return Promise.resolve({ data: [] });
    });

    (apiClient.post as vi.Mock).mockResolvedValue({ status: 200 });
  });

  const renderComponent = () =>
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <JoinSocieties />
        </MemoryRouter>
      </ThemeProvider>
    );

  it('displays a loading message initially and then renders societies', async () => {
    renderComponent();

    expect(screen.getByText(/Loading societies.../i)).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText(/Join a Society/i)).toBeInTheDocument()
    );
    expect(screen.getByText('Photography Club')).toBeInTheDocument();
    expect(screen.getByText('Chess Club')).toBeInTheDocument();
  });

  it('renders empty state when no societies are returned', async () => {
    (apiClient.get as vi.Mock).mockResolvedValueOnce({ data: [] });

    renderComponent();
    await waitFor(() =>
      expect(screen.getByText(/Join a Society/i)).toBeInTheDocument()
    );
    expect(
      screen.getByText(/No societies available to join/i)
    ).toBeInTheDocument();
  });

  it('calls the join society API when the "Join Society" button is clicked (success case)', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    renderComponent();
    await waitFor(() =>
      expect(screen.getByText('Photography Club')).toBeInTheDocument()
    );

    const joinButtons = screen.getAllByText(/Join Society/i);
    await act(async () => {
      fireEvent.click(joinButtons[0]);
    });

    expect(apiClient.post).toHaveBeenCalledWith('/api/join-society/1/');
    expect(alertSpy).toHaveBeenCalledWith('Successfully joined the society!');
    await waitFor(() =>
      expect(screen.queryByText('Photography Club')).not.toBeInTheDocument()
    );
    alertSpy.mockRestore();
  });

  it('logs an error and shows alert when joining a society fails', async () => {
    (apiClient.post as vi.Mock).mockRejectedValueOnce(new Error('Join failed'));
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderComponent();
    await waitFor(() =>
      expect(screen.getByText('Chess Club')).toBeInTheDocument()
    );

    const joinButtons = screen.getAllByText(/Join Society/i);
    await act(async () => {
      fireEvent.click(joinButtons[1]);
    });

    expect(apiClient.post).toHaveBeenCalledWith('/api/join-society/2/');
    expect(alertSpy).toHaveBeenCalledWith('Failed to join the society. Please try again.');
    expect(consoleErrorSpy).toHaveBeenCalled();

    alertSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });
});
