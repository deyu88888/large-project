import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ReportThread from '../ReportThread';
import { apiClient } from '../../../api';

// Mock dependencies
vi.mock('../../../api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn()
  }
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ reportId: '1' })
  };
});

describe('ReportThread', () => {
  const theme = createTheme();

  const mockAdminUser = {
    is_admin: true,
    is_president: false
  };

  const mockReport = {
    id: 1,
    subject: 'Test Report',
    details: 'Report details',
    from_student_username: 'student1',
    requested_at: '2023-01-01T00:00:00Z',
    report_type: 'General',
    top_level_replies: []
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  const renderComponent = (
    user = mockAdminUser, 
    report = mockReport, 
    apiError = null
  ) => {
    if (apiError) {
      (apiClient.get as any)
        .mockResolvedValueOnce({ data: user })
        .mockRejectedValueOnce(apiError);
    } else {
      (apiClient.get as any)
        .mockResolvedValueOnce({ data: user })
        .mockResolvedValueOnce({ data: report });
    }

    return render(
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={['/reports/1']}>
          <Routes>
            <Route path="/reports/:reportId" element={<ReportThread />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    );
  };

  it('renders loading state initially', async () => {
    (apiClient.get as any)
      .mockResolvedValueOnce({ data: mockAdminUser })
      .mockImplementationOnce(() => new Promise(() => {})); // Never resolves to simulate loading

    await act(async () => {
      renderComponent();
    });

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders report thread for admin user', async () => {
    await act(async () => {
      renderComponent();
    });

    expect(screen.getByText('Test Report')).toBeInTheDocument();
    expect(screen.getByText('Report: 1 - General')).toBeInTheDocument();
  });

  it('handles error state', async () => {
    await act(async () => {
      renderComponent(mockAdminUser, mockReport, {
        response: {
          status: 500,
          data: { error: 'Server error' }
        }
      });
    });
  });

  it('handles 403 error state', async () => {
    await act(async () => {
      renderComponent(mockAdminUser, mockReport, {
        response: {
          status: 403,
          data: { error: 'Permission denied' }
        }
      });
    });

    expect(screen.getByText(/You don't have permission/i)).toBeInTheDocument();
  });

  it('allows admin to compose reply', async () => {
    await act(async () => {
      renderComponent();
    });

    const composeButton = screen.getByText(/Compose Reply/i);
    fireEvent.click(composeButton);

    expect(screen.getByText(/Compose Reply/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Type your reply here.../i)).toBeInTheDocument();
  });

  it('submits reply successfully', async () => {
    // Mock successful reply submission
    (apiClient.post as any).mockResolvedValueOnce({});
    
    // Mock get requests for user, report, and updated report
    (apiClient.get as any)
      .mockResolvedValueOnce({ data: mockAdminUser })
      .mockResolvedValueOnce({ 
        data: { 
          ...mockReport, 
          top_level_replies: [{ 
            id: 3, 
            content: 'New reply', 
            replied_by_username: 'admin1', 
            created_at: '2023-01-03T00:00:00Z',
            is_admin_reply: true,
            child_replies: [] 
          }] 
        } 
      })
      .mockResolvedValueOnce({ 
        data: { 
          ...mockReport, 
          top_level_replies: [{ 
            id: 3, 
            content: 'New reply', 
            replied_by_username: 'admin1', 
            created_at: '2023-01-03T00:00:00Z',
            is_admin_reply: true,
            child_replies: [] 
          }] 
        } 
      });

    await act(async () => {
      renderComponent();
    });

    const composeButton = screen.getByText(/Compose Reply/i);
    fireEvent.click(composeButton);

    const replyInput = screen.getByPlaceholderText(/Type your reply here.../i);
    fireEvent.change(replyInput, { target: { value: 'Test reply' } });

    const sendButton = screen.getByText(/Send Reply/i);
    await act(async () => {
      fireEvent.click(sendButton);
    });

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalled();
    });
  });

  it('handles reply submission error', async () => {
    (apiClient.post as any).mockRejectedValueOnce(new Error('Reply failed'));

    await act(async () => {
      renderComponent();
    });

    const composeButton = screen.getByText(/Compose Reply/i);
    fireEvent.click(composeButton);

    const replyInput = screen.getByPlaceholderText(/Type your reply here.../i);
    fireEvent.change(replyInput, { target: { value: 'Test reply' } });

    const sendButton = screen.getByText(/Send Reply/i);
    await act(async () => {
      fireEvent.click(sendButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/Failed to submit reply/i)).toBeInTheDocument();
    });
  });

  it('handles back navigation', async () => {
    await act(async () => {
      renderComponent();
    });

    const backButton = screen.getByTestId('ArrowBackIcon');
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});