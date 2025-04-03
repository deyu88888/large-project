import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import SearchResultsPage from '../SearchResultsPage';
import { apiClient } from '../../../api';
import useAuthCheck from '../../../hooks/useAuthCheck';

vi.mock('@mui/material/CircularProgress', () => {
  return {
    default: vi.fn((props) => {
      const dataTestId = props['data-testid'] || 'CircularProgress';
      return <div data-testid={dataTestId}>Loading...</div>;
    })
  };
});

vi.mock('../../../api', () => ({
  apiClient: {
    get: vi.fn()
  }
}));

vi.mock('../../../hooks/useAuthCheck');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams('q=test'), vi.fn()]
  };
});

describe('SearchResultsPage', () => {
  const theme = createTheme();

  const mockSearchResults = {
    students: [
      {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        username: 'johndoe',
        icon: 'user-icon.jpg'
      }
    ],
    events: [
      {
        id: 1,
        title: 'Test Event',
        date: '2023-01-01'
      }
    ],
    societies: [
      {
        id: 1,
        name: 'Test Society'
      }
    ]
  };

  beforeEach(() => {
    vi.resetAllMocks();
    mockNavigate.mockReset();
    (useAuthCheck as any).mockReturnValue({
      isAuthenticated: true,
      isLoading: false
    });
    (apiClient.get as any).mockResolvedValue({ data: mockSearchResults });
  });

  const renderComponent = () => {
    return render(
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={['/search?q=test']}>
          <SearchResultsPage />
        </MemoryRouter>
      </ThemeProvider>
    );
  };

  it('renders loading state initially', async () => {
    (useAuthCheck as any).mockReturnValueOnce({
      isAuthenticated: true,
      isLoading: true
    });

    await act(async () => {
      renderComponent();
    });

  });

  it('fetches and displays search results', async () => {
    await act(async () => {
      renderComponent();
    });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Test Event')).toBeInTheDocument();
      expect(screen.getByText('Test Society')).toBeInTheDocument();
    });
  });

  it('handles search input and navigation', async () => {
    await act(async () => {
      renderComponent();
    });

    const searchInput = screen.getByPlaceholderText('Search...');
    fireEvent.change(searchInput, { target: { value: 'new query' } });
    fireEvent.keyDown(searchInput, { key: 'Enter', code: 13 });

    expect(mockNavigate).toHaveBeenCalledWith('/search?q=new%20query');
  });

  it('switches between search result tabs', async () => {
    await act(async () => {
      renderComponent();
    });

    const societiesTab = screen.getAllByRole('tab', { name: /societies/i })[0];
    fireEvent.click(societiesTab);

    await waitFor(() => {
      expect(screen.getByText('Test Society')).toBeInTheDocument();
    });

    const eventsTab = screen.getAllByRole('tab', { name: /events/i })[0];
    fireEvent.click(eventsTab);

    await waitFor(() => {
      expect(screen.getByText('Test Event')).toBeInTheDocument();
    });

    const usersTab = screen.getAllByRole('tab', { name: /users/i })[0];
    fireEvent.click(usersTab);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('shows login prompt for unauthenticated users', async () => {
    (useAuthCheck as any).mockReturnValueOnce({
      isAuthenticated: false,
      isLoading: false
    });

    await act(async () => {
      renderComponent();
    });

  });

  it('handles no search results', async () => {
    const emptyResults = {
      students: [],
      events: [],
      societies: []
    };

    await act(async () => {
      (apiClient.get as any).mockResolvedValueOnce({ data: emptyResults });
      renderComponent();
    });

    expect(screen.getByText('No results found.')).toBeInTheDocument();
  });

  it('handles search API error', async () => {
    (apiClient.get as any).mockRejectedValue(new Error('Search failed'));

    await act(async () => {
      renderComponent();
    });

    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  it('performs search via search button', async () => {
    await act(async () => {
      renderComponent();
    });

    const searchInput = screen.getByPlaceholderText('Search...');
    const searchButton = screen.getByRole('button', { 
      name: (_, element) => element.querySelector('svg') !== null 
    });

    fireEvent.change(searchInput, { target: { value: 'new query' } });
    fireEvent.click(searchButton);

    expect(mockNavigate).toHaveBeenCalledWith('/search?q=new%20query');
  });
});