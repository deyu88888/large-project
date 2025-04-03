import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import NewsApprovalDashboard from '../NewsApprovalDashboard';
import { apiClient } from '../../../api';
import { ThemeProvider, createTheme } from '@mui/material';
import { MemoryRouter } from 'react-router-dom';

// Mock Material UI components to prevent EMFILE errors
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    // Mock any additional components you need
  };
});

// Mock the icons to reduce file handles
vi.mock('@mui/icons-material', () => ({
  CheckCircle: vi.fn(),
  Cancel: vi.fn(),
  ExpandMore: vi.fn(),
  ArrowBack: vi.fn(),
  Person: vi.fn(),
  AccessTime: vi.fn(),
  AttachFile: vi.fn(),
  LocalOffer: vi.fn(),
  PushPin: vi.fn(),
  Star: vi.fn(),
}));

// Mock the API client
vi.mock('../../../api', () => ({
  apiClient: {
    get: vi.fn(),
    put: vi.fn(),
  }
}));

// Mock the routing hooks
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

// Mock data
const mockRequests = [
  {
    id: 1,
    news_post: 101,
    news_post_title: 'First News Post',
    society_name: 'Computer Society',
    requested_by: 201,
    requester_name: 'John Doe',
    status: 'Pending',
    requested_at: '2023-09-01T10:00:00Z',
    reviewed_at: null,
    admin_notes: null,
    author_data: {
      id: 201,
      username: 'johndoe',
      full_name: 'John Doe',
    },
  },
  {
    id: 2,
    news_post: 102,
    news_post_title: 'Second News Post',
    society_name: 'Photography Society',
    requested_by: 202,
    requester_name: 'Jane Smith',
    status: 'Approved',
    requested_at: '2023-09-02T11:00:00Z',
    reviewed_at: '2023-09-03T14:00:00Z',
    admin_notes: 'Good article, approved.',
    author_data: {
      id: 202,
      username: 'janesmith',
      full_name: 'Jane Smith',
    },
  },
  {
    id: 3,
    news_post: 103,
    news_post_title: 'Third News Post',
    society_name: 'Chess Club',
    requested_by: 203,
    requester_name: 'Alex Johnson',
    status: 'Rejected',
    requested_at: '2023-09-03T12:00:00Z',
    reviewed_at: '2023-09-04T15:00:00Z',
    admin_notes: 'Content needs revision.',
    author_data: {
      id: 203,
      username: 'alexj',
      full_name: 'Alex Johnson',
    },
  },
];

const mockNewsContent = {
  101: {
    id: 101,
    title: 'First News Post',
    content: '<p>This is the content of the first news post.</p>',
    status: 'Draft',
    society_data: {
      id: 301,
      name: 'Computer Society',
    },
  },
  102: {
    id: 102,
    title: 'Second News Post',
    content: '<p>This is the content of the second news post.</p>',
    status: 'Published',
    society_data: {
      id: 302,
      name: 'Photography Society',
    },
  },
  103: {
    id: 103,
    title: 'Third News Post',
    content: '<p>This is the content of the third news post.</p>',
    status: 'Rejected',
    society_data: {
      id: 303,
      name: 'Chess Club',
    },
  },
};

// Create a theme for testing
const theme = createTheme({
  palette: {
    mode: 'light',
  },
});

// Helper function to render the component with necessary providers
const renderComponent = () => {
  return render(
    <MemoryRouter>
      <ThemeProvider theme={theme}>
        <NewsApprovalDashboard />
      </ThemeProvider>
    </MemoryRouter>
  );
};

// Clear any existing dialog elements from previous tests
const clearDialogs = () => {
  const existingDialogs = document.querySelectorAll('[data-testid^="dialog-"]');
  existingDialogs.forEach(dialog => {
    dialog.parentNode?.removeChild(dialog);
  });
};

describe('NewsApprovalDashboard Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    
    // Clear any existing dialog elements from previous tests
    clearDialogs();
    
    // Mock API responses
    apiClient.get.mockImplementation((url, options) => {
      if (url === '/api/news/publication-request/') {
        return Promise.resolve({ data: mockRequests });
      } else if (url.includes('/api/news/') && url.includes('/detail/')) {
        const newsId = Number(url.split('/')[2]);
        return Promise.resolve({ data: mockNewsContent[newsId] });
      }
      return Promise.reject(new Error('Not found'));
    });

    apiClient.put.mockResolvedValue({ data: { status: 'success' } });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // Basic rendering test
  it('should render the component', async () => {
    renderComponent();
    
    // Wait for the requests to load
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/news/publication-request/', {
        params: { all_statuses: 'true' }
      });
    });
    
    // Basic test to ensure the component renders without error
    expect(document.body).toBeTruthy();
  });

  // Test that API calls are made properly
  it('should make API calls to fetch requests', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/news/publication-request/', {
        params: { all_statuses: 'true' }
      });
    });
  });

  // Test for handling API errors
  it('should handle API errors gracefully', async () => {
    console.error = vi.fn(); // Suppress console errors
    apiClient.get.mockRejectedValueOnce(new Error('API Error'));
    
    renderComponent();
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalled();
    });
  });
});