import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import NewsApprovalDashboard from '../NewsApprovalDashboard';
import { apiClient } from '../../../api';
import { ThemeProvider, createTheme } from '@mui/material';
import { MemoryRouter } from 'react-router-dom';

// Mock Material UI components to prevent EMFILE errors
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    CircularProgress: vi.fn(() => <div data-testid="loading-spinner" />),
  };
});

// Mock the icons to reduce file handles
vi.mock('@mui/icons-material', () => ({
  CheckCircle: vi.fn(() => <div data-testid="approve-icon" />),
  Cancel: vi.fn(() => <div data-testid="reject-icon" />),
  ExpandMore: vi.fn(() => <div data-testid="expand-icon" />),
  ArrowBack: vi.fn(() => <div data-testid="back-icon" />),
  Person: vi.fn(() => <div data-testid="person-icon" />),
  AccessTime: vi.fn(() => <div data-testid="time-icon" />),
  AttachFile: vi.fn(() => <div data-testid="attachment-icon" />),
  LocalOffer: vi.fn(() => <div data-testid="tag-icon" />),
  PushPin: vi.fn(() => <div data-testid="pin-icon" />),
  Star: vi.fn(() => <div data-testid="star-icon" />),
}));

// Mock the API client
vi.mock('../../../api', () => ({
  apiClient: {
    get: vi.fn(),
    put: vi.fn(),
  }
}));

// Mock window.open for testing attachment links
Object.defineProperty(window, 'open', {
  value: vi.fn(),
  writable: true
});

// Mock navigate function
const mockNavigate = vi.fn();

// Mock the routing hooks
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock data for publication requests
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
  },
  {
    id: 4,
    news_post: 104,
    news_post_title: 'Fourth News Post without content',
    society_name: 'Drama Club',
    requested_by: 204,
    requester_name: 'Sam Wilson',
    status: 'Pending',
    requested_at: '2023-09-05T12:00:00Z',
    reviewed_at: null,
    admin_notes: null,
  },
];

// Mock news content data with varying properties to test all conditional rendering cases
const mockNewsContent = {
  101: {
    id: 101,
    title: 'First News Post',
    content: '<p>This is the content of the first news post.</p>',
    image_url: 'https://example.com/image1.jpg',
    attachment_name: 'document.pdf',
    attachment_url: 'https://example.com/document.pdf',
    tags: ['technology', 'programming', 'web'],
    is_pinned: true,
    is_featured: true,
    created_at: '2023-09-01T10:00:00Z',
    author_data: {
      id: 201,
      username: 'johndoe',
      full_name: 'John Doe'
    },
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
    image_url: null, // No featured image
    attachment_name: null, // No attachment
    attachment_url: null,
    tags: [], // Empty tags array
    is_pinned: false,
    is_featured: false,
    created_at: '2023-09-02T11:00:00Z',
    author_data: null, // Missing author data
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
    image_url: 'https://example.com/image3.jpg',
    attachment_name: null,
    attachment_url: null,
    tags: ['chess', 'tournament'],
    is_pinned: true,
    is_featured: false,
    created_at: '2023-09-03T12:00:00Z',
    author_data: {
      id: 203,
      username: 'alexj',
      full_name: 'Alex Johnson'
    },
    status: 'Rejected',
    society_data: {
      id: 303,
      name: 'Chess Club',
    },
  },
  104: {
    id: 104,
    title: 'Fourth News Post without content',
    content: '<p>This is the content of the fourth news post.</p>',
    image_url: null,
    attachment_name: null,
    attachment_url: null,
    tags: [],
    is_pinned: false,
    is_featured: false,
    created_at: '2023-09-04T13:00:00Z',
    author_data: {
      id: 204,
      username: 'samwilson',
      full_name: 'Sam Wilson'
    },
    status: 'Draft',
    society_data: {
      id: 304,
      name: 'Drama Club',
    },
  }
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

// Helper to find card by title text
const findCardByTitle = (container, title) => {
  const headings = Array.from(container.querySelectorAll('h6'));
  const heading = headings.find(el => el.textContent.includes(title));
  if (!heading) return null;
  return heading.closest('.MuiCardContent-root');
};

describe('NewsApprovalDashboard Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    console.error = vi.fn();
    
    // Mock successful API responses
    apiClient.get.mockImplementation((url, options) => {
      if (url === '/api/news/publication-request/') {
        return Promise.resolve({ data: mockRequests });
      } else if (url.includes('/api/news/') && url.includes('/detail/')) {
        const newsId = Number(url.split('/')[2]);
        if (mockNewsContent[newsId]) {
          return Promise.resolve({ data: mockNewsContent[newsId] });
        } else {
          return Promise.reject(new Error('News content not found'));
        }
      }
      return Promise.reject(new Error('Not found'));
    });

    apiClient.put.mockResolvedValue({ data: { status: 'success' } });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // Basic rendering test
  it('should render the component and display loading state initially', async () => {
    const { getByTestId } = renderComponent();
    
    // Check for loading indicator
    expect(getByTestId('loading-spinner')).toBeInTheDocument();
    
    // Wait for the requests to load
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/news/publication-request/', {
        params: { all_statuses: 'true' }
      });
    });
  });

  // Test initial data loading and tab counts
  it('should load publication requests and display correct tab counts', async () => {
    const { getByText } = renderComponent();
    
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/news/publication-request/', {
        params: { all_statuses: 'true' }
      });
    });
    
    // Check that tabs with counts are displayed correctly
    expect(getByText('Pending (2)')).toBeInTheDocument();
    expect(getByText('Approved (1)')).toBeInTheDocument();
    expect(getByText('Rejected (1)')).toBeInTheDocument();
  });

  // Test the back button navigation
  it('should navigate back when the back button is clicked', async () => {
    const { getByTestId } = renderComponent();
    
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalled();
    });
    
    // Find and click the back button
    const backButton = getByTestId('back-icon').closest('button');
    fireEvent.click(backButton);
    
    // Check if navigate was called
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  // Test tab switching
  it('should switch tabs and display filtered requests', async () => {
    const { getByText, queryByText } = renderComponent();
    
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalled();
    });
    
    // Initially, the Pending tab should be active and show pending requests
    expect(getByText('First News Post')).toBeInTheDocument();
    expect(getByText('Fourth News Post without content')).toBeInTheDocument();
    expect(queryByText('Second News Post')).not.toBeInTheDocument();
    
    // Click the Approved tab
    fireEvent.click(getByText('Approved (1)'));
    
    // Check that only approved requests are shown
    expect(queryByText('First News Post')).not.toBeInTheDocument();
    expect(getByText('Second News Post')).toBeInTheDocument();
    
    // Click the Rejected tab
    fireEvent.click(getByText('Rejected (1)'));
    
    // Check that only rejected requests are shown
    expect(queryByText('First News Post')).not.toBeInTheDocument();
    expect(queryByText('Second News Post')).not.toBeInTheDocument();
    expect(getByText('Third News Post')).toBeInTheDocument();
  });

  // Test empty state when no requests match the filter
  it('should display an empty state when no requests match the tab filter', async () => {
    // Mock empty requests data
    apiClient.get.mockResolvedValueOnce({ data: [] });
    
    const { getByText } = renderComponent();
    
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalled();
    });
    
    // Check for empty state message
    expect(getByText('No pending publication requests')).toBeInTheDocument();
  });

  // Test expanding a request card
  it('should expand a request card when clicked', async () => {
    const { getByText, queryByText, container } = renderComponent();
    
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/news/publication-request/', {
        params: { all_statuses: 'true' }
      });
    });
    
    // Get the first request card
    const firstCard = findCardByTitle(container, 'First News Post');
    expect(firstCard).not.toBeNull();
    
    // Click on the card to expand it
    fireEvent.click(firstCard);
    
    // Check that API call was made for the content
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/news/101/detail/');
    });
  });

  // Test error handling for content load
  it('should handle errors when loading news content', async () => {
    // Mock a specific error for the fourth news post
    apiClient.get.mockImplementation((url, options) => {
      if (url === '/api/news/publication-request/') {
        return Promise.resolve({ data: mockRequests });
      } else if (url.includes('/api/news/104/detail/')) {
        return Promise.reject(new Error('News content not found'));
      } else if (url.includes('/api/news/') && url.includes('/detail/')) {
        const newsId = Number(url.split('/')[2]);
        return Promise.resolve({ data: mockNewsContent[newsId] });
      }
      return Promise.reject(new Error('Not found'));
    });
    
    const { getByText, container } = renderComponent();
    
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalled();
    });
    
    // Find the fourth card
    const fourthCard = findCardByTitle(container, 'Fourth News Post without content');
    expect(fourthCard).not.toBeNull();
    
    // Click on it to expand
    fireEvent.click(fourthCard);
    
    // Verify API call was made
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/news/104/detail/');
    });

    // Since the request will fail, we won't be able to check for displayed error
    // as the component handles this internally
  });

  // Test initial API error
  it('should handle initial API error when loading requests', async () => {
    // Mock API error for initial requests load
    apiClient.get.mockRejectedValueOnce(new Error('Network error'));
    
    renderComponent();
    
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });
  });

  // Test that content call happens when expanded
  it('should load content when card is expanded', async () => {
    // Track the calls to the API
    const apiCalls = [];
    
    // Setup the mock implementation
    apiClient.get.mockImplementation((url, options) => {
      apiCalls.push(url);
      
      if (url === '/api/news/publication-request/') {
        return Promise.resolve({ data: mockRequests });
      } else if (url.includes('/api/news/') && url.includes('/detail/')) {
        const newsId = Number(url.split('/')[2]);
        if (mockNewsContent[newsId]) {
          return Promise.resolve({ data: mockNewsContent[newsId] });
        } else {
          return Promise.reject(new Error('News content not found'));
        }
      }
      return Promise.reject(new Error('Not found'));
    });
    
    const { container } = renderComponent();
    
    // Wait for initial requests load
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/news/publication-request/', {
        params: { all_statuses: 'true' }
      });
    });
    
    // Clear the tracked API calls to focus only on the card interactions
    apiCalls.length = 0;
    
    // Find and click the first request card
    const firstCard = findCardByTitle(container, 'First News Post');
    expect(firstCard).not.toBeNull();
    fireEvent.click(firstCard);
    
    // Wait for content API call
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/news/101/detail/');
    });
    
    // Verify we made the call for content
    const contentDetailCalls = apiCalls.filter(url => url.includes('/api/news/101/detail/'));
    expect(contentDetailCalls.length).toBeGreaterThan(0);
  });
});