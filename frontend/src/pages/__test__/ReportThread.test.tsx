import React from 'react';
import {
  render,
  screen,
  waitFor,
  fireEvent,
  act
} from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ReportThread from '../ReportThread'; // Path as provided
import { apiClient } from '../../api'; // Path as provided
import '@testing-library/jest-dom';

// Create theme instances for testing
const theme = createTheme({
  palette: {
    mode: 'light',
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

// ----------------------------------------------------------------
// Updated API Mock: include correct endpoints for admin routes
vi.mock('../../api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// ----------------------------------------------------------------
// Mock useNavigate and useParams
const mockNavigate = vi.fn();
const mockUseParams = vi.fn().mockReturnValue({ reportId: '123' });

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockUseParams(),
  };
});

// ----------------------------------------------------------------
// Sample Data
const mockReportId = '123';
const mockReport = {
  id: 123,
  report_type: 'Technical Issue',
  subject: 'Website Login Problem',
  details: 'I cannot log in to the system',
  requested_at: '2025-03-01T12:00:00Z',
  from_student_username: 'student123',
  top_level_replies: [
    {
      id: 456,
      content: 'We will look into this issue.',
      created_at: '2025-03-02T12:30:00Z',
      replied_by_username: 'admin1',
      is_admin_reply: true,
      child_replies: [
        {
          id: 789,
          content: 'Thank you for looking into it.',
          created_at: '2025-03-02T13:00:00Z',
          replied_by_username: 'student123',
          is_admin_reply: false,
          child_replies: [],
        },
      ],
    },
  ],
};

// User data for different roles
const mockAdminUser = {
  is_admin: true,
  is_president: false,
};

const mockPresidentUser = {
  is_admin: false,
  is_president: true,
};

const mockStudentUser = {
  is_admin: false,
  is_president: false,
};

// ----------------------------------------------------------------
// Updated setup function per instructions
const setup = async (userRole = 'admin', useDarkTheme = false) => {
  let userData;
  switch (userRole) {
    case 'admin':
      userData = mockAdminUser;
      break;
    case 'president':
      userData = mockPresidentUser;
      break;
    default:
      userData = mockStudentUser;
  }

  // Set up the API mock responses with corrected endpoints
  vi.mocked(apiClient.get).mockImplementation((url: string) => {
    if (url === `/api/admin/report-thread/${mockReportId}`) {
      return Promise.resolve({ data: mockReport });
    } else if (url === '/api/user/current') {
      return Promise.resolve({ data: userData });
    }
    return Promise.reject(new Error(`API call not mocked: ${url}`));
  });

  vi.mocked(apiClient.post).mockResolvedValue({
    data: { success: true },
  });

  let rendered;
  await act(async () => {
    rendered = render(
      <ThemeProvider theme={useDarkTheme ? darkTheme : theme}>
        <MemoryRouter initialEntries={[`/report/${mockReportId}`]}>
          <Routes>
            <Route path="/report/:reportId" element={<ReportThread />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    );
    // Wait for all promises to resolve
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  return rendered;
};

// ----------------------------------------------------------------
// Tests
describe('ReportThread Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseParams.mockReturnValue({ reportId: mockReportId });
    vi.mocked(apiClient.get).mockReset();
    vi.mocked(apiClient.post).mockReset();
  });

  it('renders loading state initially', async () => {
    // Delay API response to ensure loading state is captured
    const mockGetFn = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ data: mockReport }), 100)
        )
    );
    vi.mocked(apiClient.get).mockImplementation(mockGetFn);

    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={[`/report/${mockReportId}`]}>
          <Routes>
            <Route path="/report/:reportId" element={<ReportThread />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders report thread data correctly', async () => {
    // Mock correct API responses with corrected endpoint paths
    vi.mocked(apiClient.get).mockImplementation((url: string) => {
      if (url === `/api/admin/report-thread/${mockReportId}`) {
        return Promise.resolve({ data: mockReport });
      } else if (url === '/api/user/current') {
        return Promise.resolve({ data: mockAdminUser });
      }
      return Promise.reject(new Error(`API call not mocked: ${url}`));
    });

    await act(async () => {
      render(
        <ThemeProvider theme={theme}>
          <MemoryRouter initialEntries={[`/report/${mockReportId}`]}>
            <Routes>
              <Route path="/report/:reportId" element={<ReportThread />} />
            </Routes>
          </MemoryRouter>
        </ThemeProvider>
      );
      // Wait for all promises to resolve
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Check report header content
    expect(screen.getByText('Website Login Problem')).toBeInTheDocument();
    expect(
      screen.getByText(/Report: 123 - Technical Issue/)
    ).toBeInTheDocument();

    // Check original report details
    expect(
      screen.getByText('I cannot log in to the system')
    ).toBeInTheDocument();
    const studentNames = screen.getAllByText(/student123/);
    expect(studentNames.length).toBeGreaterThan(0);

    // Check replies with flexible matcher for admin name
    expect(
      screen.getByText('We will look into this issue.')
    ).toBeInTheDocument();
    expect(screen.getByText(/admin1/)).toBeInTheDocument();
    expect(
      screen.getByText('Thank you for looking into it.')
    ).toBeInTheDocument();
  });

  it('navigates back when back button is clicked', async () => {
    await setup('admin');

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Find the ArrowBackIcon by its test id and then get its closest button
    const backIcon = screen.getByTestId('ArrowBackIcon');
    const backButton = backIcon.closest('button');
    expect(backButton).toBeInTheDocument();
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('shows compose reply form when button is clicked', async () => {
    await setup('admin');

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Use text matcher for the compose reply button
    const composeButton = screen.getByText(/Compose Reply/i);
    fireEvent.click(composeButton);

    // Check if reply form is displayed
    expect(screen.getByText('Compose Reply')).toBeInTheDocument();
    expect(screen.getByLabelText('Replying to')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type your reply here...')).toBeInTheDocument();
  });

  it('handles reply submission for admin users', async () => {
    await setup('admin');

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Mock successful post request and subsequent get
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: { success: true },
    });
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: mockReport,
    });

    const composeButton = screen.getByText(/Compose Reply/i);
    fireEvent.click(composeButton);

    const replyInput = screen.getByPlaceholderText('Type your reply here...');
    fireEvent.change(replyInput, {
      target: { value: 'This is a test reply' },
    });

    const sendButton = screen.getByRole('button', { name: /send reply/i });
    await act(async () => {
      fireEvent.click(sendButton);
    });

    // Verify API call with corrected post path
    expect(apiClient.post).toHaveBeenCalledWith('/api/admin/report-replies', {
      report: mockReportId,
      parent_reply: null,
      content: 'This is a test reply',
    });
  });

  it('displays error message when API fetch fails', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('API error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={[`/report/${mockReportId}`]}>
          <Routes>
            <Route path="/report/:reportId" element={<ReportThread />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch report thread')).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it('handles reply submission errors', async () => {
    await setup('admin');

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    vi.mocked(apiClient.post).mockRejectedValueOnce({
      response: {
        data: {
          error: 'Failed to submit reply: Server error',
        },
      },
    });

    const composeButton = screen.getByText(/Compose Reply/i);
    fireEvent.click(composeButton);

    const replyInput = screen.getByPlaceholderText('Type your reply here...');
    fireEvent.change(replyInput, { target: { value: 'This is a test reply' } });

    const sendButton = screen.getByRole('button', { name: /send reply/i });
    await act(async () => {
      fireEvent.click(sendButton);
    });

    expect(screen.getByText('Failed to submit reply: Server error')).toBeInTheDocument();
  });

  it('cancels reply composition when back button is clicked', async () => {
    await setup('admin');

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    const composeButton = screen.getByText(/Compose Reply/i);
    fireEvent.click(composeButton);

    const replyInput = screen.getByPlaceholderText('Type your reply here...');
    expect(replyInput).toBeInTheDocument();

    // Use the suggested form back button selector (second button)
    const formBackButton = screen.getAllByRole('button')[1];
    expect(formBackButton).toBeInTheDocument();
    fireEvent.click(formBackButton);

    expect(screen.queryByPlaceholderText('Type your reply here...')).not.toBeInTheDocument();
  });

  it('handles different user roles correctly - student', async () => {
    await setup('student');

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Verify that student can only reply to admin messages
    expect(screen.getByText(/Compose Reply/i)).toBeInTheDocument();

    const composeButton = screen.getByText(/Compose Reply/i);
    fireEvent.click(composeButton);

    expect(screen.getByText('You can only reply to admin messages')).toBeInTheDocument();
    expect(screen.queryByText('Original Report (Direct Reply)')).not.toBeInTheDocument();
  });

  it('handles different user roles correctly - admin', async () => {
    await setup('admin');

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    const composeButton = screen.getByText(/Compose Reply/i);
    fireEvent.click(composeButton);
    expect(
      screen.getByText('As an admin, you can reply directly to the report or to any message')
    ).toBeInTheDocument();
  });

  it('renders correctly in dark theme', async () => {
    await setup('admin', true);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Website Login Problem')).toBeInTheDocument();
  });

  it('disables reply button for student when no admin replies are available', async () => {
    // Create a modified report with no admin replies
    const noAdminRepliesReport = {
      ...mockReport,
      top_level_replies: [],
    };

    vi.mocked(apiClient.get).mockImplementation((url: string) => {
      if (url === `/api/admin/report-thread/${mockReportId}`) {
        return Promise.resolve({ data: noAdminRepliesReport });
      } else if (url === '/api/user/current') {
        return Promise.resolve({ data: mockStudentUser });
      }
      return Promise.reject(new Error(`API call not mocked: ${url}`));
    });

    await act(async () => {
      render(
        <ThemeProvider theme={theme}>
          <MemoryRouter initialEntries={[`/report/${mockReportId}`]}>
            <Routes>
              <Route path="/report/:reportId" element={<ReportThread />} />
            </Routes>
          </MemoryRouter>
        </ThemeProvider>
      );
    });

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    expect(
      screen.getByText('You cannot reply yet because there are no admin messages to respond to.')
    ).toBeInTheDocument();

    const composeButton = screen.getByText(/Compose Reply/i);
    expect(composeButton).toBeDisabled();
  });

  it('displays "Report not found" when report is null', async () => {
    vi.mocked(apiClient.get).mockImplementation((url: string) => {
      if (url === `/api/admin/report-thread/${mockReportId}`) {
        return Promise.resolve({ data: null });
      } else if (url === '/api/user/current') {
        return Promise.resolve({ data: mockStudentUser });
      }
      return Promise.reject(new Error(`API call not mocked: ${url}`));
    });

    await act(async () => {
      render(
        <ThemeProvider theme={theme}>
          <MemoryRouter initialEntries={[`/report/${mockReportId}`]}>
            <Routes>
              <Route path="/report/:reportId" element={<ReportThread />} />
            </Routes>
          </MemoryRouter>
        </ThemeProvider>
      );
    });

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Report not found')).toBeInTheDocument();
  });
});
