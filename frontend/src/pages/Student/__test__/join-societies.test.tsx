import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import JoinSocieties from '../JoinSociety';
import { apiClient } from '../../../api';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../../api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

let themeModeOverride = 'light';
vi.mock('@mui/material/styles', async () => {
  const actual = await vi.importActual('@mui/material/styles');
  return {
    ...actual,
    useTheme: () => ({
      palette: {
        mode: themeModeOverride,
      },
    }),
  };
});

vi.mock('../../../theme/theme', () => ({
  tokens: () => ({
    primary: {
      400: '#mock-primary-400',
      500: '#mock-primary-500',
      1000: '#mock-primary-1000',
    },
    grey: {
      100: '#mock-grey-100',
      300: '#mock-grey-300',
      600: '#mock-grey-600',
      700: '#mock-grey-700',
    },
    blueAccent: {
      400: '#mock-blue-400',
      500: '#mock-blue-500',
    },
  }),
}));

describe('JoinSocieties Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    themeModeOverride = 'light';
    (apiClient.get as vi.Mock).mockImplementation((url: string) => {
      if (url === '/api/join-society') {
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
      <ThemeProvider theme={createTheme()}>
        <MemoryRouter>
          <JoinSocieties />
        </MemoryRouter>
      </ThemeProvider>
    );

  it('displays a loading message initially and then renders societies', async () => {
    renderComponent();
    expect(screen.getByText(/Loading societies.../i)).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByText(/Loading societies.../i)).not.toBeInTheDocument()
    );
    expect(screen.getByText(/Join a Society/i)).toBeInTheDocument();
    const societyElements = screen.getAllByRole('heading', { level: 3 });
    const societyNames = societyElements.map((el) => el.textContent);
    expect(societyNames).toContain('Photography Club');
    expect(societyNames).toContain('Chess Club');
  });

  it('renders empty state when no societies are returned', async () => {
    (apiClient.get as vi.Mock).mockResolvedValueOnce({ data: [] });
    renderComponent();
    await waitFor(() =>
      expect(screen.getByText(/Join a Society/i)).toBeInTheDocument()
    );
    expect(screen.getByText(/No societies available to join/i)).toBeInTheDocument();
  });

  it('calls the join society API when the "Join Society" button is clicked (success case)', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    renderComponent();
    await waitFor(() =>
      expect(screen.queryByText(/Loading societies.../i)).not.toBeInTheDocument()
    );
    const societyElements = screen.getAllByRole('heading', { level: 3 });
    const joinButtons = screen.getAllByText(/Join Society/i);
    const photoIndex = societyElements.findIndex(
      (el) => el.textContent === 'Photography Club'
    );
    expect(photoIndex).not.toBe(-1);
    await act(async () => {
      fireEvent.click(joinButtons[photoIndex]);
    });
    expect(apiClient.post).toHaveBeenCalledWith('/api/join-society/1/');
    expect(alertSpy).toHaveBeenCalledWith('Successfully joined the society!');
    alertSpy.mockRestore();
  });

  it('logs an error and shows alert when joining a society fails', async () => {
    (apiClient.post as vi.Mock).mockRejectedValueOnce(new Error('Join failed'));
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderComponent();
    await waitFor(() =>
      expect(screen.queryByText(/Loading societies.../i)).not.toBeInTheDocument()
    );
    const societyElements = screen.getAllByRole('heading', { level: 3 });
    const joinButtons = screen.getAllByText(/Join Society/i);
    const chessIndex = societyElements.findIndex(
      (el) => el.textContent === 'Chess Club'
    );
    expect(chessIndex).not.toBe(-1);
    await act(async () => {
      fireEvent.click(joinButtons[chessIndex]);
    });
    expect(apiClient.post).toHaveBeenCalledWith('/api/join-society/2/');
    expect(alertSpy).toHaveBeenCalledWith(
      'Failed to join the society. Please try again.'
    );
    expect(consoleErrorSpy).toHaveBeenCalled();
    alertSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('navigates to society view page when "View Society" button is clicked', async () => {
    renderComponent();
    await waitFor(() =>
      expect(screen.queryByText(/Loading societies.../i)).not.toBeInTheDocument()
    );
    const viewButtons = screen.getAllByText(/View Society/i);
    await act(async () => {
      fireEvent.click(viewButtons[0]);
    });
    expect(mockNavigate).toHaveBeenCalledWith('/student/view-society/1');
  });

  it('handles error when fetching societies fails', async () => {
    (apiClient.get as vi.Mock).mockRejectedValueOnce(new Error('Fetch error'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderComponent();
    await waitFor(() =>
      expect(screen.queryByText(/Loading societies.../i)).not.toBeInTheDocument()
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error fetching societies:',
      expect.any(Error)
    );
    expect(screen.getByText(/No societies available to join/i)).toBeInTheDocument();
    consoleErrorSpy.mockRestore();
  });

  it('renders correctly with dark theme', async () => {
    themeModeOverride = 'dark';
    renderComponent();
    await waitFor(() =>
      expect(screen.queryByText(/Loading societies.../i)).not.toBeInTheDocument()
    );
    expect(screen.getByText(/Join a Society/i)).toBeInTheDocument();
  });

  it('renders society with no description', async () => {
    (apiClient.get as vi.Mock).mockResolvedValueOnce({
      data: [
        {
          id: 3,
          name: 'Society with No Description',
          description: null,
        },
      ],
    });
    renderComponent();
    await waitFor(() =>
      expect(screen.queryByText(/Loading societies.../i)).not.toBeInTheDocument()
    );
    expect(screen.getByText(/No description available/i)).toBeInTheDocument();
  });

  it('handles unmounting during data fetching', async () => {
    let resolvePromise: Function;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    (apiClient.get as vi.Mock).mockReturnValueOnce(pendingPromise);
    const { unmount } = renderComponent();
    unmount();
    await act(async () => {
      resolvePromise({ data: [] });
    });
  });

  it('removes society from list after joining', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    renderComponent();
    await waitFor(() =>
      expect(screen.getAllByText(/Join Society/i)).toHaveLength(2)
    );
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(2);
    await act(async () => {
      fireEvent.click(screen.getAllByText(/Join Society/i)[0]);
    });
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(1);
    expect(screen.queryByText(/Photography Club/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Chess Club/i)).toBeInTheDocument();
    alertSpy.mockRestore();
  });
});
