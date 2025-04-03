import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import AdminReportList from '../AdminReportList';
import { SearchContext } from '../../../components/layout/SearchContext';

// Mock theme
const theme = createTheme({
  palette: {
    mode: 'light',
  }
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  }
});

// Mock navigate function
const mockNavigate = vi.fn();

// Mock useSettingsStore
vi.mock('../../../stores/settings-store', () => ({
  useSettingsStore: () => ({
    drawer: false
  }),
}));

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock the fetchReports function directly
const mockFetchReports = vi.fn();
vi.mock('../../../utils/fetchReports', () => ({
  fetchReports: () => mockFetchReports()
}));

describe('AdminReportList Component', () => {
  const mockReports = [
    {
      id: '1',
      from_student: 'John Doe',
      email: 'john@example.com',
      report_type: 'Academic',
      subject: 'Test Subject 1',
      details: 'This is a test report detail',
      requested_at: '2023-01-01T12:00:00Z'
    },
    {
      id: '2',
      from_student: '',
      email: 'jane@example.com',
      report_type: 'Behavior',
      subject: 'Test Subject 2',
      details: 'Another test report detail',
      requested_at: '2023-01-02T12:00:00Z'
    }
  ];

  const mockSearchContextValue = {
    searchTerm: '',
    setSearchTerm: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchReports.mockResolvedValue(mockReports);
  });

  const setup = async (searchTerm = '', useDarkTheme = false) => {
    const contextValue = {
      ...mockSearchContextValue,
      searchTerm
    };
    
    let renderResult;
    
    await act(async () => {
      renderResult = render(
        <ThemeProvider theme={useDarkTheme ? darkTheme : theme}>
          <SearchContext.Provider value={contextValue}>
            <MemoryRouter>
              <AdminReportList />
            </MemoryRouter>
          </SearchContext.Provider>
        </ThemeProvider>
      );
    });
    
    await waitFor(() => expect(mockFetchReports).toHaveBeenCalled());
    
    return renderResult;
  };

  it('fetches and displays reports correctly', async () => {
    await setup();
    
    // Check for table headers
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Reporter')).toBeInTheDocument();
    expect(screen.getByText('Report Type')).toBeInTheDocument();
    expect(screen.getByText('Subject')).toBeInTheDocument();
    expect(screen.getByText('Details')).toBeInTheDocument();
    expect(screen.getByText('Requested At')).toBeInTheDocument();
    
    // Check for report data
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Public User')).toBeInTheDocument();
    expect(screen.getByText('Academic')).toBeInTheDocument();
    expect(screen.getByText('Test Subject 1')).toBeInTheDocument();
    expect(screen.getByText('This is a test report detail')).toBeInTheDocument();
    
    // Check if there are Reply buttons
    const replyButtons = screen.getAllByText('Reply');
    expect(replyButtons.length).toBe(1);
    
    // Check if there are Email Reply buttons
    const emailReplyButtons = screen.getAllByText('Email Reply');
    expect(emailReplyButtons.length).toBe(1);
  });

  it('handles error when fetching reports fails', async () => {
    mockFetchReports.mockRejectedValueOnce(new Error('Failed to fetch reports'));
    
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    await setup();
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });
    
    consoleSpy.mockRestore();
  });

  it('filters reports based on search term', async () => {
    await setup('John');
    
    // Verify that the filtered report is in the document
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    
    // The other report should not be visible when filtered
    expect(screen.queryByText('Test Subject 2')).not.toBeInTheDocument();
  });

  it('navigates to reply page when Reply button is clicked', async () => {
    await setup();
    
    const replyButtons = screen.getAllByText('Reply');
    
    fireEvent.click(replyButtons[0]);
    
    expect(mockNavigate).toHaveBeenCalledWith('/admin/report-list/1/reply');
  });

  it('has mailto link for public users with email', async () => {
    await setup();
    
    const emailReplyButtons = screen.getAllByText('Email Reply');
    
    expect(emailReplyButtons[0].closest('a')).toHaveAttribute(
      'href',
      expect.stringContaining('mailto:jane@example.com')
    );
  });

  it('renders correctly in dark theme', async () => {
    await setup('', true);

    // Verify content is displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Public User')).toBeInTheDocument();
  });
});