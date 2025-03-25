import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReportReply from '../ReportReply';
import { apiClient } from '../../../api';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Mock the required dependencies
vi.mock('../../../api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn()
  }
}));

vi.mock('@mui/material/styles', async () => {
  const actual = await vi.importActual('@mui/material/styles');
  return {
    ...actual,
    useTheme: () => ({
      palette: {
        mode: 'light',
      },
    }),
  };
});

vi.mock('../../../theme/theme', () => ({
  tokens: () => ({
    primary: { 500: '#f0f0f0', 600: '#e0e0e0' },
    grey: { 100: '#f5f5f5' },
    blueAccent: { 500: '#1976d2', 600: '#1565c0' },
  }),
}));

// Mock navigate function
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ reportId: '123' })
  };
});

const mockReport = {
  id: 123,
  report_type: 'Complaint',
  subject: 'Test Subject',
  details: 'This is a test report detail',
  from_student_username: 'student123',
  requested_at: '2023-10-15T14:30:00Z'
};

describe('ReportReply', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mocks
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockReport });
    vi.mocked(apiClient.post).mockResolvedValue({ data: { success: true } });
    
    // Mock window.alert
    window.alert = vi.fn();
  });

  it('shows loading state initially', async () => {
    // Keep component in loading state by not resolving the promise
    vi.mocked(apiClient.get).mockImplementation(() => new Promise(() => {}));
    
    render(
      <MemoryRouter initialEntries={['/admin/report-list/123/reply']}>
        <Routes>
          <Route path="/admin/report-list/:reportId/reply" element={<ReportReply />} />
        </Routes>
      </MemoryRouter>
    );

    // Should show loading indicator
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders report details after loading', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/report-list/123/reply']}>
        <Routes>
          <Route path="/admin/report-list/:reportId/reply" element={<ReportReply />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Check API call - Updated to match the actual endpoint
    expect(apiClient.get).toHaveBeenCalledWith('/api/reports/to-admin/123/');

    // Verify report details are displayed
    await waitFor(() => {
      expect(screen.getByText(/Report Type: Complaint/i)).toBeInTheDocument();
      expect(screen.getByText(/Subject: Test Subject/i)).toBeInTheDocument();
      expect(screen.getByText(/Details: This is a test report detail/i)).toBeInTheDocument();
      expect(screen.getByText(/Reported by: student123/i)).toBeInTheDocument();
    });
  });

  it('handles API fetch errors correctly', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('API Error'));

    render(
      <MemoryRouter initialEntries={['/admin/report-list/123/reply']}>
        <Routes>
          <Route path="/admin/report-list/:reportId/reply" element={<ReportReply />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch report details/i)).toBeInTheDocument();
    });
  });

  it('allows entering and submitting a reply', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/admin/report-list/123/reply']}>
        <Routes>
          <Route path="/admin/report-list/:reportId/reply" element={<ReportReply />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Find the text field and enter a reply
    const textField = screen.getByRole('textbox');
    await user.type(textField, 'This is my test reply');
    expect(textField).toHaveValue('This is my test reply');

    // Find and click the submit button
    const submitButton = screen.getByRole('button', { name: /Submit Reply/i });
    await user.click(submitButton);

    // Verify API call - Updated to match the actual endpoint
    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/api/reports/replies/', {
        report: '123',
        content: 'This is my test reply'
      });
      expect(window.alert).toHaveBeenCalledWith('Reply submitted successfully!');
      expect(mockNavigate).toHaveBeenCalledWith('/admin/reports');
    });
  });

  it('shows error message when reply submission fails', async () => {
    vi.mocked(apiClient.post).mockRejectedValue(new Error('Submission error'));
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/admin/report-list/123/reply']}>
        <Routes>
          <Route path="/admin/report-list/:reportId/reply" element={<ReportReply />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Find the text field and enter a reply
    const textField = screen.getByRole('textbox');
    await user.type(textField, 'This is my test reply');

    // Find and click the submit button
    const submitButton = screen.getByRole('button', { name: /Submit Reply/i });
    await user.click(submitButton);

    // Check for error message
    await waitFor(() => {
      expect(screen.getByText('Failed to submit reply')).toBeInTheDocument();
    });
  });
});