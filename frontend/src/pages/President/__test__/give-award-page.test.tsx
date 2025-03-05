import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { apiClient } from '../../api'; // Adjust the import path as needed
import GiveAwardPage from './give-award-page'; // Adjust the import path as needed

// Mock the dependencies
vi.mock('../../api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Create a mock theme
const theme = createTheme();

describe('GiveAwardPage Component', () => {
  const mockNavigate = vi.fn();
  const mockStudentId = '456';
  const mockAlert = vi.fn();
  
  const mockAwards = [
    {
      id: 1,
      rank: 'Gold',
      title: 'Outstanding Achievement',
      description: 'Awarded for exceptional contributions',
      is_custom: false
    },
    {
      id: 2,
      rank: 'Silver',
      title: 'Excellence Award',
      description: 'Recognizes excellence in performance',
      is_custom: false
    },
    {
      id: 3,
      rank: 'Bronze',
      title: 'Participation Award',
      description: 'For active participation in society events',
      is_custom: true
    }
  ];

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock window.alert
    global.alert = mockAlert;

    // Mock useNavigate
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom');
      return {
        ...actual,
        useNavigate: () => mockNavigate,
      };
    });

    // Mock API client success responses
    (apiClient.get as vi.Mock).mockResolvedValue({
      data: mockAwards
    });
    
    (apiClient.post as vi.Mock).mockResolvedValue({
      data: { success: true }
    });
  });

  const renderComponent = (studentId = mockStudentId) => {
    return render(
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={[`/give-award-page/${studentId}`]}>
          <Routes>
            <Route 
              path="/give-award-page/:student_id" 
              element={<GiveAwardPage />} 
            />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    );
  };

  it('renders loading state initially', () => {
    renderComponent();
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders the component with correct title and awards after loading', async () => {
    renderComponent();
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check for title and subtitle
    expect(screen.getByText('Select an Award')).toBeInTheDocument();
    expect(screen.getByText('Choose an award to give to the student.')).toBeInTheDocument();
    
    // Check that awards are displayed
    expect(screen.getByText('Outstanding Achievement (Gold)')).toBeInTheDocument();
    expect(screen.getByText('Excellence Award (Silver)')).toBeInTheDocument();
    expect(screen.getByText('Participation Award (Bronze)')).toBeInTheDocument();
    
    // Check that descriptions are displayed
    expect(screen.getByText('Awarded for exceptional contributions')).toBeInTheDocument();
    expect(screen.getByText('Recognizes excellence in performance')).toBeInTheDocument();
    expect(screen.getByText('For active participation in society events')).toBeInTheDocument();
  });

  it('calls API with correct payload when giving an award', async () => {
    renderComponent();
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Find all "Give Award" buttons
    const giveAwardButtons = screen.getAllByText('Give Award');
    
    // Click the first award button
    fireEvent.click(giveAwardButtons[0]);
    
    // Check that the API was called with correct parameters
    expect(apiClient.post).toHaveBeenCalledWith(
      '/api/award-students',
      { student_id: Number(mockStudentId), award_id: 1 }
    );
    
    // Verify alert and navigation
    expect(mockAlert).toHaveBeenCalledWith('Award assigned successfully!');
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('handles error when fetching awards fails', async () => {
    const errorMessage = 'Failed to load awards.';
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    (apiClient.get as vi.Mock).mockRejectedValueOnce(new Error('API Error'));
    
    renderComponent();
    
    // Wait for error state to appear
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
    
    // Verify error was logged
    expect(consoleErrorSpy).toHaveBeenCalled();
    
    consoleErrorSpy.mockRestore();
  });

  it('handles error when giving award fails', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    renderComponent();
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Mock API error for post request
    (apiClient.post as vi.Mock).mockRejectedValueOnce(new Error('API Error'));
    
    // Click the first "Give Award" button
    const giveAwardButtons = screen.getAllByText('Give Award');
    fireEvent.click(giveAwardButtons[0]);
    
    // Verify error handling
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(mockAlert).toHaveBeenCalledWith('Failed to assign award.');
    });
    
    consoleErrorSpy.mockRestore();
  });

  it('displays "No awards available" when awards array is empty', async () => {
    (apiClient.get as vi.Mock).mockResolvedValueOnce({
      data: []
    });
    
    renderComponent();
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check for empty state message
    expect(screen.getByText('No awards available.')).toBeInTheDocument();
  });

  it('navigates back when Back button is clicked', async () => {
    renderComponent();
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Click the Back button
    fireEvent.click(screen.getByText('Back'));
    
    // Verify navigation
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});