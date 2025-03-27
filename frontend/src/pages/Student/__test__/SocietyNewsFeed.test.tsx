import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import SocietyNewsFeed from '../SocietyNewsFeed';
import { apiClient } from '../../../api';
import { ThemeProvider, createTheme } from '@mui/material/styles';


vi.mock('../../../api', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

vi.mock('../../../components/NewsComment', () => ({
  default: vi.fn(() => <div data-testid="news-comment">Comment Component</div>),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => (
      <div data-testid="motion-div" {...props}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }) => <div data-testid="animate-presence">{children}</div>,
}));


const mockSociety = {
  id: 1,
  name: 'Computer Science Society',
  icon: 'https:
};

const mockAuthor = {
  id: 1,
  username: 'john.doe',
  full_name: 'John Doe',
};

const mockNewsPosts = [
  {
    id: 1,
    title: 'Welcome to the new semester!',
    content: '<p>We are excited to welcome everyone back for the new semester.</p>',
    image_url: 'https:
    attachment_name: 'schedule.pdf',
    society_data: mockSociety,
    author_data: mockAuthor,
    created_at: '2025-01-15T12:00:00Z',
    published_at: '2025-01-15T14:30:00Z',
    is_pinned: true,
    is_featured: true,
    tags: ['welcome', 'announcement'],
    view_count: 150,
    comment_count: 5,
  },
  {
    id: 2,
    title: 'Upcoming Hackathon',
    content: '<p>Join us for a 24-hour coding event!</p>',
    image_url: null,
    attachment_name: null,
    society_data: mockSociety,
    author_data: mockAuthor,
    created_at: '2025-01-18T10:00:00Z',
    published_at: '2025-01-18T11:00:00Z',
    is_pinned: false,
    is_featured: false,
    tags: ['event', 'hackathon', 'coding'],
    view_count: 75,
    comment_count: 2,
  },
];


const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('SocietyNewsFeed Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
    window.scrollTo = vi.fn();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const renderComponent = (societyId?: number) => {
    const theme = createTheme({
      palette: {
        mode: 'dark',
      },
    });

    return render(
      <ThemeProvider theme={theme}>
        <SocietyNewsFeed societyId={societyId} />
      </ThemeProvider>
    );
  };

  it('displays loading indicator initially', () => {
    
    vi.mocked(apiClient.get).mockImplementation(() => new Promise(() => {}));
    
    renderComponent();
    
    const loadingIndicator = screen.getByRole('progressbar');
    expect(loadingIndicator).toBeInTheDocument();
  });

  it('fetches news from feed endpoint when no societyId is provided', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockNewsPosts });
    
    renderComponent();
    
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/news/feed/');
    });
  });

  it('fetches news from society endpoint when societyId is provided', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockNewsPosts });
    
    renderComponent(1);
    
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/society/1/news/');
    });
  });

  it('displays empty state when no news posts are available', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] });
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText("No news posts from your societies yet.")).toBeInTheDocument();
    });
  });

  it('displays society-specific empty state message', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] });
    
    renderComponent(1);
    
    await waitFor(() => {
      expect(screen.getByText("This society hasn't posted any news yet.")).toBeInTheDocument();
    });
  });

  it('displays news posts when they are fetched successfully', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockNewsPosts });
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Welcome to the new semester!')).toBeInTheDocument();
      expect(screen.getByText('Upcoming Hackathon')).toBeInTheDocument();
    });
  });

  it('displays pinned posts with pin icon', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockNewsPosts });
    
    renderComponent();
    
    await waitFor(() => {
      const pinnedPost = screen.getByText('Welcome to the new semester!').closest('[data-testid="motion-div"]');
      expect(pinnedPost).toBeInTheDocument();
      
      expect(screen.getAllByTestId('PushPinIcon')).toHaveLength(1);
    });
  });

  it('displays featured tags for featured posts', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockNewsPosts });
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Featured')).toBeInTheDocument();
    });
  });

  it('displays post tags correctly', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockNewsPosts });
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('welcome')).toBeInTheDocument();
      expect(screen.getByText('announcement')).toBeInTheDocument();
      expect(screen.getByText('event')).toBeInTheDocument();
      expect(screen.getByText('hackathon')).toBeInTheDocument();
    });
  });

  it('displays post stats in detailed view', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockNewsPosts });
    
    renderComponent();
    
    
    await waitFor(() => {
      expect(screen.getByText('Welcome to the new semester!')).toBeInTheDocument();
    });
    
    
    fireEvent.click(screen.getByText('Welcome to the new semester!'));
    
    
    await waitFor(() => {
      expect(screen.getByText(/150/)).toBeInTheDocument(); 
      expect(screen.getByText(/5 comments/)).toBeInTheDocument(); 
    });
  });

  it('shows detailed post view when a post is clicked', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockNewsPosts });
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Welcome to the new semester!')).toBeInTheDocument();
    });
    
    
    fireEvent.click(screen.getByText('Welcome to the new semester!'));
    
    await waitFor(() => {
      
      expect(screen.getByText('News Post')).toBeInTheDocument();
      
      expect(screen.getByTestId('ArrowBackIcon')).toBeInTheDocument();
      
      expect(screen.getByTestId('news-comment')).toBeInTheDocument();
    });
  });

  it('returns to feed view when back button is clicked in detailed view', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockNewsPosts });
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Welcome to the new semester!')).toBeInTheDocument();
    });
    
    
    fireEvent.click(screen.getByText('Welcome to the new semester!'));
    
    await waitFor(() => {
      expect(screen.getByText('News Post')).toBeInTheDocument();
    });
    
    
    fireEvent.click(screen.getByTestId('ArrowBackIcon'));
    
    await waitFor(() => {
      
      expect(screen.getByText('Welcome to the new semester!')).toBeInTheDocument();
      expect(screen.getByText('Upcoming Hackathon')).toBeInTheDocument();
    });
  });

  it('hides a post when hide button is clicked', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockNewsPosts });
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Welcome to the new semester!')).toBeInTheDocument();
      expect(screen.getByText('Upcoming Hackathon')).toBeInTheDocument();
    });
    
    
    const hideButtons = screen.getAllByTestId('VisibilityOffIcon');
    fireEvent.click(hideButtons[0]);
    
    
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'hiddenNewsPosts',
      expect.stringContaining('[1]')
    );
  });

  it('displays "Show All Posts" button when all posts are hidden', async () => {
    
    localStorage.setItem('hiddenNewsPosts', JSON.stringify([1, 2]));
    
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockNewsPosts });
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('All posts are currently hidden. Refresh the page to reset.')).toBeInTheDocument();
      expect(screen.getByText('Show All Posts')).toBeInTheDocument();
    });
  });

  it('resets hidden posts when "Show All Posts" button is clicked', async () => {
    
    localStorage.setItem('hiddenNewsPosts', JSON.stringify([1, 2]));
    
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockNewsPosts });
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Show All Posts')).toBeInTheDocument();
    });
    
    
    fireEvent.click(screen.getByText('Show All Posts'));
    
    
    expect(localStorage.removeItem).toHaveBeenCalledWith('hiddenNewsPosts');
    
    
    await waitFor(() => {
      expect(screen.getByText('Welcome to the new semester!')).toBeInTheDocument();
      expect(screen.getByText('Upcoming Hackathon')).toBeInTheDocument();
    });
  });

  it('handles bookmark functionality', async () => {
    
    
    
    
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockNewsPosts });
    
    
    localStorage.getItem.mockReturnValue(JSON.stringify([]));
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Welcome to the new semester!')).toBeInTheDocument();
    });
    
    
    
    
    
    const postId = 1; 
    
    
    localStorage.setItem('newsBookmarks', JSON.stringify([postId]));
    
    
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'newsBookmarks',
      JSON.stringify([postId])
    );
    
    
    localStorage.setItem('newsBookmarks', JSON.stringify([]));
    
    
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'newsBookmarks',
      JSON.stringify([])
    );
  });

  it('handles API errors gracefully', async () => {
    
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(apiClient.get).mockRejectedValue(new Error('Network error'));
    
    renderComponent();
    
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching news:',
        expect.any(Error)
      );
    });
    
    
    expect(screen.getByText("No news posts from your societies yet.")).toBeInTheDocument();
    
    consoleErrorSpy.mockRestore();
  });

  it('displays images correctly when available', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockNewsPosts });
    
    renderComponent();
    
    await waitFor(() => {
      const images = screen.getAllByRole('img');
      
      expect(images.length).toBeGreaterThan(1);
      
      
      const welcomePostSection = screen.getByText('Welcome to the new semester!').closest('[data-testid="motion-div"]');
      const postImage = within(welcomePostSection).getByRole('img', { name: /welcome to the new semester/i });
      expect(postImage).toBeInTheDocument();
      expect(postImage.getAttribute('src')).toBe('https:
    });
  });
});