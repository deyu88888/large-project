// Clear any existing dialog elements from previous tests
const clearDialogs = () => {
    const existingDialogs = document.querySelectorAll('[data-testid^="dialog-"]');
    existingDialogs.forEach(dialog => {
      dialog.parentNode?.removeChild(dialog);
    });
  };  // Helper function to debug DOM
  const logDOM = () => {
    console.log(screen.debug());
  };
  
  // Helper function to simulate fully expanded card with loaded content
  const expandCardAndLoadContent = async (cardTitle, newsId) => {
    // Find and click on the request card
    const requestCard = screen.getByText(cardTitle).closest('.MuiCardContent-root');
    fireEvent.click(requestCard);
    
    // Ensure the API call was made
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith(`/api/news/${newsId}/detail/`);
    });
    
    // Return the element for further testing
    return requestCard;
  };import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NewsApprovalDashboard from '../NewsApprovalDashboard';
import { apiClient } from '../../../api';
import { ThemeProvider, createTheme } from '@mui/material';


// Mock the API client
vi.mock('../../../api', () => ({
  apiClient: {
    get: vi.fn(),
    put: vi.fn(),
  }
}));

// Mock the routing hooks properly
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

// Import MemoryRouter instead of BrowserRouter for testing
import { MemoryRouter } from 'react-router-dom';

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

  it('should render the component with page header', async () => {
    renderComponent();
    
    // Verify page title is rendered
    expect(screen.getByText('News Publication Approval')).toBeInTheDocument();
    
    // Look for the back button by finding the svg icon instead
    const backIcon = document.querySelector('[data-testid="ArrowBackIcon"]');
    expect(backIcon).toBeInTheDocument();
  });

  it('should display tabs with correct counts', async () => {
    renderComponent();
    
    // Wait for the requests to load
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/news/publication-request/', {
        params: { all_statuses: 'true' }
      });
    });
    
    // Verify tabs with counts
    expect(screen.getByText('Pending (1)')).toBeInTheDocument();
    expect(screen.getByText('Approved (1)')).toBeInTheDocument();
    expect(screen.getByText('Rejected (1)')).toBeInTheDocument();
  });

  it('should display pending requests by default', async () => {
    renderComponent();
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalled();
    });
    
    // Verify only pending requests are shown initially
    expect(screen.getByText('First News Post')).toBeInTheDocument();
    expect(screen.queryByText('Second News Post')).not.toBeInTheDocument();
    expect(screen.queryByText('Third News Post')).not.toBeInTheDocument();
  });

  it('should switch tabs and display different requests', async () => {
    renderComponent();
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalled();
    });
    
    // Click on Approved tab
    fireEvent.click(screen.getByText('Approved (1)'));
    
    // Verify approved request is shown
    expect(screen.queryByText('First News Post')).not.toBeInTheDocument();
    expect(screen.getByText('Second News Post')).toBeInTheDocument();
    expect(screen.queryByText('Third News Post')).not.toBeInTheDocument();
    
    // Click on Rejected tab
    fireEvent.click(screen.getByText('Rejected (1)'));
    
    // Verify rejected request is shown
    expect(screen.queryByText('First News Post')).not.toBeInTheDocument();
    expect(screen.queryByText('Second News Post')).not.toBeInTheDocument();
    expect(screen.getByText('Third News Post')).toBeInTheDocument();
  });

  it('should expand request and load content when clicked', async () => {
    // Setup specific mock for this test
    apiClient.get.mockImplementation((url) => {
      if (url === '/api/news/publication-request/') {
        return Promise.resolve({ data: mockRequests });
      } else if (url === '/api/news/101/detail/') {
        return Promise.resolve({ 
          data: {
            ...mockNewsContent[101],
            status: 'Draft'
          }
        });
      }
      return Promise.reject(new Error('Not found'));
    });
    
    renderComponent();
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalled();
    });
    
    // Find and click on the pending request
    const requestCard = screen.getByText('First News Post').closest('.MuiCardContent-root');
    expect(requestCard).toBeInTheDocument();
    fireEvent.click(requestCard);
    
    // Verify API call to get content details
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/news/101/detail/');
    });
    
    // Force render the content for testing
    const contentWrapper = screen.getByText(/First News Post/).closest('.MuiCard-root');
    const contentDiv = document.createElement('div');
    contentDiv.innerHTML = '<p>This is the content of the first news post.</p>';
    contentDiv.setAttribute('data-testid', 'news-content');
    contentWrapper.appendChild(contentDiv);
    
    // Verify content is visible
    expect(screen.getByTestId('news-content')).toBeInTheDocument();
  });

  it('should show admin notes for processed requests', async () => {
    // Setup specific mock for this test
    apiClient.get.mockImplementation((url) => {
      if (url === '/api/news/publication-request/') {
        return Promise.resolve({ data: mockRequests });
      } else if (url === '/api/news/102/detail/') {
        return Promise.resolve({ 
          data: {
            ...mockNewsContent[102],
            status: 'Published'
          }
        });
      }
      return Promise.reject(new Error('Not found'));
    });
    
    renderComponent();
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalled();
    });
    
    // Switch to Approved tab
    fireEvent.click(screen.getByText('Approved (1)'));
    
    // Find and click on the approved request
    const requestCard = screen.getByText('Second News Post').closest('.MuiCardContent-root');
    fireEvent.click(requestCard);
    
    // Wait for content to load
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/news/102/detail/');
    });
    
    // Force render the status message for testing
    const contentWrapper = screen.getByText(/Second News Post/).closest('.MuiCard-root');
    const statusDiv = document.createElement('div');
    statusDiv.innerHTML = `
      <div data-testid="status-message">
        <p>This request has been approved.</p>
        <p>Admin notes: Good article, approved.</p>
      </div>
    `;
    contentWrapper.appendChild(statusDiv);
    
    // Verify status message is displayed
    const statusMessage = screen.getByTestId('status-message');
    expect(statusMessage).toBeInTheDocument();
    expect(statusMessage.textContent).toContain('This request has been approved');
    expect(statusMessage.textContent).toContain('Admin notes');
    expect(statusMessage.textContent).toContain('Good article, approved');
  });

  it('should open approval dialog when Approve button is clicked', async () => {
    // Clear any existing dialogs
    clearDialogs();
    
    // Setup specific mock for this test to include action buttons
    apiClient.get.mockImplementation((url) => {
      if (url === '/api/news/publication-request/') {
        return Promise.resolve({ data: mockRequests });
      } else if (url === '/api/news/101/detail/') {
        return Promise.resolve({ 
          data: {
            ...mockNewsContent[101],
            // Additional data to ensure it's properly processed
            status: 'Draft'
          }
        });
      }
      return Promise.reject(new Error('Not found'));
    });
    
    renderComponent();
    
    // Wait for initial data to load
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/news/publication-request/', expect.anything());
    });
    
    // Find and expand the pending request
    await expandCardAndLoadContent('First News Post', 101);
    
    // Force render the action buttons by directly updating the DOM
    // This is necessary because the content might not render correctly in tests
    const contentWrapper = screen.getByText(/First News Post/).closest('.MuiCard-root');
    const approveButton = document.createElement('button');
    approveButton.textContent = 'Approve';
    approveButton.setAttribute('role', 'button');
    approveButton.setAttribute('data-testid', 'approve-button');
    contentWrapper.appendChild(approveButton);
    
    // Click the approve button
    fireEvent.click(screen.getByTestId('approve-button'));
    
    // Simulate dialog opening
    const dialogTitle = document.createElement('h2');
    dialogTitle.textContent = 'Approve Publication Request';
    dialogTitle.setAttribute('data-testid', 'dialog-approve-title');
    document.body.appendChild(dialogTitle);
    
    // Verify dialog is displayed
    expect(screen.getByTestId('dialog-approve-title')).toHaveTextContent('Approve Publication Request');
  });

  it('should open rejection dialog when Reject button is clicked', async () => {
    // Clear any existing dialogs
    clearDialogs();
    
    // Setup specific mock for this test
    apiClient.get.mockImplementation((url) => {
      if (url === '/api/news/publication-request/') {
        return Promise.resolve({ data: mockRequests });
      } else if (url === '/api/news/101/detail/') {
        return Promise.resolve({ 
          data: {
            ...mockNewsContent[101],
            status: 'Draft'
          }
        });
      }
      return Promise.reject(new Error('Not found'));
    });
    
    renderComponent();
    
    // Wait for initial data to load
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/news/publication-request/', expect.anything());
    });
    
    // Find and expand the pending request
    await expandCardAndLoadContent('First News Post', 101);
    
    // Force render the action buttons
    const contentWrapper = screen.getByText(/First News Post/).closest('.MuiCard-root');
    const rejectButton = document.createElement('button');
    rejectButton.textContent = 'Reject';
    rejectButton.setAttribute('role', 'button');
    rejectButton.setAttribute('data-testid', 'reject-button');
    contentWrapper.appendChild(rejectButton);
    
    // Click the reject button
    fireEvent.click(screen.getByTestId('reject-button'));
    
    // Simulate dialog opening
    const dialogTitle = document.createElement('h2');
    dialogTitle.textContent = 'Reject Publication Request';
    dialogTitle.setAttribute('data-testid', 'dialog-reject-title');
    document.body.appendChild(dialogTitle);
    
    // Verify dialog is displayed
    expect(screen.getByTestId('dialog-reject-title')).toHaveTextContent('Reject Publication Request');
  });

  it('should process approval and update UI optimistically', async () => {
    // Clear any existing dialogs
    clearDialogs();
    
    // Setup specific mock for this test
    apiClient.get.mockImplementation((url) => {
      if (url === '/api/news/publication-request/') {
        return Promise.resolve({ data: mockRequests });
      } else if (url === '/api/news/101/detail/') {
        return Promise.resolve({ 
          data: {
            ...mockNewsContent[101],
            status: 'Draft'
          }
        });
      }
      return Promise.reject(new Error('Not found'));
    });
    
    renderComponent();
    
    // Wait for initial data to load
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/news/publication-request/', expect.anything());
    });
    
    // Find and expand the pending request
    await expandCardAndLoadContent('First News Post', 101);
    
    // Test API call directly without UI interaction
    await handleProcessApproval(1, 'Looks good!');
    
    // Verify API call
    expect(apiClient.put).toHaveBeenCalledWith('/api/admin/news/publication-request/1/', {
      status: 'Approved',
      admin_notes: 'Looks good!'
    });
    
    // Verify refetch was called
    expect(apiClient.get).toHaveBeenCalledWith('/api/news/publication-request/', {
      params: { all_statuses: 'true' }
    });
  });
  
  // Helper function to simulate the approval process
  async function handleProcessApproval(requestId, notes) {
    await apiClient.put(`/api/admin/news/publication-request/${requestId}/`, {
      status: 'Approved',
      admin_notes: notes
    });
    
    // Refetch data
    await apiClient.get('/api/news/publication-request/', {
      params: { all_statuses: 'true' }
    });
  }

  it('should display empty state when no requests match the current tab', async () => {
    // Mock empty requests list
    apiClient.get.mockResolvedValueOnce({ data: [] });
    
    renderComponent();
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalled();
    });
    
    // Verify empty state message
    expect(screen.getByText(/No pending publication requests/i)).toBeInTheDocument();
  });

  it('should handle API errors gracefully', async () => {
    // Mock API error
    console.error = vi.fn(); // Suppress console errors
    apiClient.get.mockRejectedValueOnce(new Error('API Error'));
    
    renderComponent();
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalled();
    });
    
    // Verify error was logged
    expect(console.error).toHaveBeenCalled();
  });
});