import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useNavigate } from 'react-router-dom';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import JoinSocieties from '../JoinSociety';
import { apiClient, getRecommendedSocieties } from '../../../api';

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
  getRecommendedSocieties: vi.fn(),
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
      600: '#mock-primary-600',
      700: '#mock-primary-700',
      1000: '#mock-primary-1000',
    },
    grey: {
      100: '#mock-grey-100',
      200: '#mock-grey-200',
      300: '#mock-grey-300',
      400: '#mock-grey-400',
      600: '#mock-grey-600',
      700: '#mock-grey-700',
      800: '#mock-grey-800',
    },
    blueAccent: {
      400: '#mock-blue-400',
      500: '#mock-blue-500',
    },
    redAccent: {
      300: '#mock-red-300',
      400: '#mock-red-400',
      500: '#mock-red-500',
    },
    greenAccent: {
      400: '#mock-green-400',
      500: '#mock-green-500',
      600: '#mock-green-600',
    },
  }),
}));

describe('JoinSocieties Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    themeModeOverride = 'light';
    (getRecommendedSocieties as vi.Mock).mockResolvedValue([
      {
        society: {
          id: 1,
          name: 'Photography Club',
          description: 'A club for photography enthusiasts',
          category: 'Arts',
          tags: ['photography', 'creative'],
        },
        explanation: {
          type: 'popular',
          message: 'Suggested society for new members',
        },
      },
      {
        society: {
          id: 2,
          name: 'Chess Club',
          description: 'Challenge your mind with chess!',
          category: 'Games',
          tags: ['strategy', 'chess'],
        },
        explanation: {
          type: 'category',
          message: 'Matches your interests',
        },
      },
    ]);
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
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument());
    expect(screen.getByText(/Recommended Societies/i)).toBeInTheDocument();
    const societyElements = screen.getAllByRole('heading', { level: 3 });
    const societyNames = societyElements.map(el => el.textContent);
    expect(societyNames).toContain('Photography Club');
    expect(societyNames).toContain('Chess Club');
  });

  it('renders empty state when no societies are returned', async () => {
    (getRecommendedSocieties as vi.Mock).mockResolvedValueOnce([]);
    renderComponent();
    await waitFor(() => expect(screen.getByText(/Join a Society/i)).toBeInTheDocument());
    expect(screen.getByText(/No societies available to join/i)).toBeInTheDocument();
  });

  it('calls the view society function when the "View Society" button is clicked', async () => {
    renderComponent();
    await waitFor(() => expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument());
    const viewButtons = screen.getAllByText(/View Society/i);
    await act(async () => {
      fireEvent.click(viewButtons[0]);
    });
    expect(mockNavigate).toHaveBeenCalledWith('/student/view-society/1');
  });

  it('calls view society for the second society', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText('Chess Club')).toBeInTheDocument());
    const viewButtons = screen.getAllByText(/View Society/i);
    await act(async () => {
      fireEvent.click(viewButtons[1]);
    });
    expect(mockNavigate).toHaveBeenCalledWith('/student/view-society/2');
  });

  it('handles error when fetching society recommendations fails', async () => {
    (getRecommendedSocieties as vi.Mock).mockRejectedValueOnce(new Error('Fetch error'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderComponent();
    await waitFor(() => expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument());
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching society recommendations:', expect.any(Error));
    expect(screen.getByText(/Failed to load recommendations/i)).toBeInTheDocument();
    consoleErrorSpy.mockRestore();
  });

  it('renders correctly with dark theme', async () => {
    themeModeOverride = 'dark';
    renderComponent();
    await waitFor(() => expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument());
    expect(screen.getByText(/Recommended Societies/i)).toBeInTheDocument();
  });

  it('renders society with no description', async () => {
    (getRecommendedSocieties as vi.Mock).mockResolvedValueOnce([
      {
        society: {
          id: 3,
          name: 'Society with No Description',
          description: null,
          category: 'Other',
        },
        explanation: {
          type: 'popular',
          message: 'Suggested society',
        },
      },
    ]);
    renderComponent();
    await waitFor(() => expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument());
    expect(screen.getByText(/No description available/i)).toBeInTheDocument();
  });

  it('toggles between category view and all view', async () => {
    renderComponent();
    await waitFor(() => expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument());
    const categoryButton = screen.getByText(/Group by Category/i);
    const allViewButton = screen.getByText(/View All/i);
    const categoryHeadings = screen.getAllByRole('heading', { level: 2 });
    expect(categoryHeadings.length).toBeGreaterThan(0);
    await act(async () => {
      fireEvent.click(allViewButton);
    });
    expect(screen.queryAllByRole('heading', { level: 2 })).toHaveLength(0);
    await act(async () => {
      fireEvent.click(categoryButton);
    });
    const newCategoryHeadings = screen.getAllByRole('heading', { level: 2 });
    expect(newCategoryHeadings.length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { level: 2, name: 'Arts' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Games' })).toBeInTheDocument();
  });
});
