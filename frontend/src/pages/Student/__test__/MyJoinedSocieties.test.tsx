import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import MyJoinedSocieties from '../MyJoinedSocieties';
import { apiClient } from '../../../api';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';

// Mock navigate function
const mockNavigate = vi.fn();

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock API client
vi.mock('../../../api', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

// Mock societies data with complete URLs
const mockSocieties = [
  {
    id: 1,
    name: 'Computer Science Society',
    description: 'A society for computer science enthusiasts.',
    icon: 'https://example.com/cs-icon.png',
  },
  {
    id: 2,
    name: 'Chess Club',
    description: 'Weekly chess meetups and tournaments.',
    icon: 'https://example.com/chess-icon.png',
  },
];

describe('MyJoinedSocieties Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (theme = 'light') => {
    const customTheme = createTheme({
      palette: {
        mode: theme === 'light' ? 'light' : 'dark',
      },
    });

    return render(
      <ThemeProvider theme={customTheme}>
        <MemoryRouter>
          <MyJoinedSocieties />
        </MemoryRouter>
      </ThemeProvider>
    );
  };

  it('displays loading state initially', () => {
    // Make the API call never resolve to keep loading state
    vi.mocked(apiClient.get).mockImplementation(() => new Promise(() => {}));
    
    renderComponent();
    
    expect(screen.getByText('Loading societies...')).toBeInTheDocument();
  });

  it('displays empty state when no societies are returned', async () => {
    // Mock empty data response
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] });
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText("You haven't joined any societies yet.")).toBeInTheDocument();
    });
    
    expect(screen.queryByText('Loading societies...')).not.toBeInTheDocument();
  });

  it('displays societies when they are fetched successfully', async () => {
    // Mock successful data response
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockSocieties });
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Computer Science Society')).toBeInTheDocument();
      expect(screen.getByText('Chess Club')).toBeInTheDocument();
    });
    
    expect(screen.getByText('A society for computer science enthusiasts.')).toBeInTheDocument();
    expect(screen.getByText('Weekly chess meetups and tournaments.')).toBeInTheDocument();
    expect(screen.queryByText('Loading societies...')).not.toBeInTheDocument();
  });

  it('renders society icons correctly', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockSocieties });
    
    renderComponent();
    
    await waitFor(() => {
      const csIcon = screen.getByAltText('Computer Science Society icon');
      const chessIcon = screen.getByAltText('Chess Club icon');
      
      expect(csIcon).toBeInTheDocument();
      expect(csIcon.getAttribute('src')).toBe('https://example.com/cs-icon.png');
      
      expect(chessIcon).toBeInTheDocument();
      expect(chessIcon.getAttribute('src')).toBe('https://example.com/chess-icon.png');
    });
  });

  it('truncates long descriptions', async () => {
    const longDescription = 'A'.repeat(200);
    const truncatedSocieties = [
      {
        id: 3,
        name: 'Long Description Society',
        description: longDescription,
        icon: 'https://example.com/long-desc-icon.png',
      },
    ];
    
    vi.mocked(apiClient.get).mockResolvedValue({ data: truncatedSocieties });
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Long Description Society')).toBeInTheDocument();
    });
    
    const displayedDescription = screen.getByText(/^A+\.\.\.$/);
    expect(displayedDescription).toBeInTheDocument();
    expect(displayedDescription.textContent?.length).toBeLessThan(longDescription.length);
    expect(displayedDescription.textContent?.endsWith('...')).toBe(true);
  });

  it('handles empty descriptions', async () => {
    const emptyDescSociety = [
      {
        id: 4,
        name: 'No Description Society',
        description: '',
        icon: 'https://example.com/no-desc-icon.png',
      },
    ];
    
    vi.mocked(apiClient.get).mockResolvedValue({ data: emptyDescSociety });
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('No Description Society')).toBeInTheDocument();
      expect(screen.getByText('No description available.')).toBeInTheDocument();
    });
  });

  it('navigates to society detail page when view button is clicked', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockSocieties });
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getAllByText('View Society').length).toBe(2);
    });
    
    // Click the first "View Society" button
    fireEvent.click(screen.getAllByText('View Society')[0]);
    
    expect(mockNavigate).toHaveBeenCalledWith('/student/view-society/1');
  });

  it('renders header with correct text', () => {
    vi.mocked(apiClient.get).mockImplementation(() => new Promise(() => {}));
    
    renderComponent();
    
    expect(screen.getByRole('heading', { name: 'My Societies' })).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    // Mock API error
    vi.mocked(apiClient.get).mockRejectedValue(new Error('API Error'));
    
    // Spy on console.error
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    renderComponent();
    
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching societies:',
        expect.any(Error)
      );
    });
    
    // Should show empty state on error
    expect(screen.getByText("You haven't joined any societies yet.")).toBeInTheDocument();
    
    consoleErrorSpy.mockRestore();
  });

  it('renders with dark theme correctly', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockSocieties });
    
    renderComponent('dark');
    
    // Verify content renders in dark theme
    await waitFor(() => {
      expect(screen.getByText('Computer Science Society')).toBeInTheDocument();
    });
  });
  
  it('handles navigation errors gracefully', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockSocieties });
    
    // Make navigation throw an error
    mockNavigate.mockImplementation(() => {
      throw new Error('Navigation Error');
    });
    
    // Spy on console.error
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getAllByText('View Society').length).toBe(2);
    });
    
    // Click button that triggers navigation error
    fireEvent.click(screen.getAllByText('View Society')[0]);
    
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error viewing society:',
      expect.any(Error)
    );
    
    consoleErrorSpy.mockRestore();
  });
});