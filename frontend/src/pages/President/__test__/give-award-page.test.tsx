import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import GiveAwardPage from '../give-award-page';


const theme = createTheme();


vi.mock('../../../api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));


import { apiClient } from '../../../api';


const mockNavigate = vi.fn();


vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ student_id: '456' }),
  };
});

describe('GiveAwardPage Component', () => {
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
    
    vi.clearAllMocks();

    
    global.alert = mockAlert;

    
    (apiClient.get).mockResolvedValue({
      data: mockAwards
    });
    
    (apiClient.post).mockResolvedValue({
      data: { success: true }
    });
  });

 
  const setup = async () => {
    let renderResult;
    
    await act(async () => {
      renderResult = render(
        <ThemeProvider theme={theme}>
          <MemoryRouter initialEntries={[`/give-award/${mockStudentId}`]}>
            <Routes>
              <Route path="/give-award/:student_id" element={<GiveAwardPage />} />
            </Routes>
          </MemoryRouter>
        </ThemeProvider>
      );
      
     
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    return renderResult;
  };

  it('renders loading state initially', async () => {
    
    const originalGet = apiClient.get;
    (apiClient.get).mockImplementation(() => new Promise(resolve => {
     
      setTimeout(() => resolve({ data: mockAwards }), 1000);
    }));
    
    await act(async () => {
      render(
        <ThemeProvider theme={theme}>
          <MemoryRouter initialEntries={[`/give-award/${mockStudentId}`]}>
            <Routes>
              <Route path="/give-award/:student_id" element={<GiveAwardPage />} />
            </Routes>
          </MemoryRouter>
        </ThemeProvider>
      );
    });
    
   
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    
   
    (apiClient.get).mockImplementation(originalGet);
  });

  it('fetches and displays awards correctly', async () => {
    await setup();

    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

   
    expect(screen.getByText('Select an Award')).toBeInTheDocument();
    expect(screen.getByText('Choose an award to give to the student.')).toBeInTheDocument();

    
    expect(screen.getByText('Outstanding Achievement (Gold)')).toBeInTheDocument();
    expect(screen.getByText('Excellence Award (Silver)')).toBeInTheDocument();
    expect(screen.getByText('Participation Award (Bronze)')).toBeInTheDocument();

    
    expect(screen.getByText('Awarded for exceptional contributions')).toBeInTheDocument();
    expect(screen.getByText('Recognizes excellence in performance')).toBeInTheDocument();
    expect(screen.getByText('For active participation in society events')).toBeInTheDocument();

   
    expect(apiClient.get).toHaveBeenCalledWith('/api/awards');
  });

  it('handles giving an award successfully', async () => {
    await setup();

    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    
    const giveAwardButtons = screen.getAllByText('Give Award');
    
    await act(async () => {
      fireEvent.click(giveAwardButtons[0]);
    });

    
    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/api/award-students', {
        student_id: 456,
        award_id: 1
      });
    });

    
    expect(mockAlert).toHaveBeenCalledWith('Award assigned successfully!');
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('handles API error when giving award', async () => {
    
    (apiClient.post).mockRejectedValueOnce(new Error('Failed to assign award'));
    
   
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await setup();

    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

   
    const giveAwardButtons = screen.getAllByText('Give Award');
    
    await act(async () => {
      fireEvent.click(giveAwardButtons[0]);
    });

    
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(mockAlert).toHaveBeenCalledWith('Failed to assign award.');
    });

    
    expect(mockNavigate).not.toHaveBeenCalled();

    
    consoleErrorSpy.mockRestore();
  });

  it('handles API error when fetching awards', async () => {
    
    (apiClient.get).mockRejectedValueOnce(new Error('Failed to load awards'));
    
    
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await act(async () => {
      render(
        <ThemeProvider theme={theme}>
          <MemoryRouter initialEntries={[`/give-award/${mockStudentId}`]}>
            <Routes>
              <Route path="/give-award/:student_id" element={<GiveAwardPage />} />
            </Routes>
          </MemoryRouter>
        </ThemeProvider>
      );
    });

   
    await waitFor(() => {
      expect(screen.getByText('Failed to load awards.')).toBeInTheDocument();
    });

    
    expect(consoleErrorSpy).toHaveBeenCalled();

    
    consoleErrorSpy.mockRestore();
  });

  it('displays message when no awards are available', async () => {
    
    (apiClient.get).mockResolvedValueOnce({
      data: []
    });

    await setup();

    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    
    expect(screen.getByText('No awards available.')).toBeInTheDocument();
  });

  it('navigates back when back button is clicked', async () => {
    await setup();

   
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

   
    const backButton = screen.getByText('Back');
    
    await act(async () => {
      fireEvent.click(backButton);
    });

    
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});