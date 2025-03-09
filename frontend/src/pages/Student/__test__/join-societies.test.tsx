import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useNavigate } from 'react-router-dom';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import JoinSocieties from '../join-societies';
import { apiClient } from '../../../api';
import { view } from 'framer-motion';

vi.mock('../../../api', () => ({
  apiClient: {
    get: vi.fn(),
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

describe('JoinSocieties Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();

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

  it('calls the view society API when the "View Society" button is clicked (success case)', async () => {
    renderComponent();
    await waitFor(() =>
      expect(screen.getByText('Photography Club')).toBeInTheDocument()
    );

    const viewButtons = screen.getAllByText(/View Society/i);
    await act(async () => {
      fireEvent.click(viewButtons[0]);
    });

    expect(mockNavigate).toHaveBeenCalledWith('/student/view-society/1');
  });

  it('calls view society for the alternative society', async () => {
    renderComponent();
    await waitFor(() =>
      expect(screen.getByText('Chess Club')).toBeInTheDocument()
    );

    const viewButtons = screen.getAllByText(/View Society/i);
    await act(async () => {
      fireEvent.click(viewButtons[1]);
    });

    expect(mockNavigate).toHaveBeenCalledWith('/student/view-society/2');
  });
});
