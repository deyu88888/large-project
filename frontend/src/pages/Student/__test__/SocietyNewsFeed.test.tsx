import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import SocietyNewsFeed from '../SocietyNewsFeed';
import { apiClient } from '../../../api';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Mock all Material-UI Components
vi.mock('@mui/material', () => {
  const actual = vi.importActual('@mui/material');
  return {
    ...actual,
    useTheme: () => ({
      palette: {
        mode: 'dark',
      },
    }),
    Box: ({ children, ...props }) => <div data-testid="mui-box" {...props}>{children}</div>,
    Typography: ({ children, variant, ...props }) => <div data-testid={`mui-typography-${variant || 'default'}`} {...props}>{children}</div>,
    Paper: ({ children, ...props }) => <div data-testid="mui-paper" {...props}>{children}</div>,
    Button: ({ children, ...props }) => <button data-testid="mui-button" {...props}>{children}</button>,
    CircularProgress: (props) => <div data-testid="mui-circular-progress" {...props} />,
    Chip: ({ label, ...props }) => <div data-testid="mui-chip" {...props}>{label}</div>,
    Avatar: ({ children, ...props }) => <div data-testid="mui-avatar" {...props}>{children}</div>,
    Divider: (props) => <hr data-testid="mui-divider" {...props} />,
    Card: ({ children, ...props }) => <div data-testid="mui-card" {...props}>{children}</div>,
    CardContent: ({ children, ...props }) => <div data-testid="mui-card-content" {...props}>{children}</div>,
    CardActions: ({ children, ...props }) => <div data-testid="mui-card-actions" {...props}>{children}</div>,
    IconButton: ({ children, onClick, ...props }) => <button data-testid="mui-icon-button" onClick={onClick} {...props}>{children}</button>,
  };
});

// Mock all MUI Icons at once
vi.mock('@mui/icons-material', () => {
  return {
    Comment: () => <div data-testid="CommentIcon" />,
    StarOutline: () => <div data-testid="StarOutlineIcon" />,
    PushPin: () => <div data-testid="PushPinIcon" />,
    Bookmark: () => <div data-testid="BookmarkIcon" />,
    BookmarkBorder: () => <div data-testid="BookmarkBorderIcon" />,
    Visibility: () => <div data-testid="VisibilityIcon" />,
    VisibilityOff: () => <div data-testid="VisibilityOffIcon" />,
    AttachFile: () => <div data-testid="AttachFileIcon" />,
    ArrowBack: () => <div data-testid="ArrowBackIcon" />,
  };
});

// Mock API client
vi.mock('../../../api', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

// Mock NewsComment component
vi.mock('../../../components/NewsComment', () => ({
  default: vi.fn(() => <div data-testid="news-comment">Comment Component</div>),
}));

// Mock framer-motion
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

// Mock theme tokens
vi.mock('../../theme/theme', () => ({
  tokens: () => ({
    grey: {
      100: '#f0f0f0',
      200: '#e0e0e0',
      300: '#c0c0c0',
      400: '#a0a0a0',
      500: '#909090',
      600: '#808080',
      700: '#707070',
      800: '#606060',
    },
    primary: {
      300: '#505050',
      400: '#404040',
      500: '#303030',
      600: '#202020',
    },
    blueAccent: {
      200: '#80d8ff',
      300: '#40c4ff',
      400: '#00b0ff',
      500: '#0091ea',
      700: '#0064b7',
    },
    greenAccent: {
      400: '#00e676',
      500: '#00c853',
      700: '#00963f',
      800: '#00602a',
    },
  }),
}));

const mockSociety = {
  id: 1,
  name: 'Computer Science Society',
  icon: 'https://example.com/icon.png',
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
    image_url: 'https://example.com/welcome.jpg',
    attachment_url: 'https://example.com/schedule.pdf',
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
    attachment_url: null,
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

// Mock localStorage
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
    
    expect(screen.getByTestId('mui-circular-progress')).toBeInTheDocument();
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

  it('displays post tags correctly', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockNewsPosts });
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Featured')).toBeInTheDocument();
      expect(screen.getByText('welcome')).toBeInTheDocument();
      expect(screen.getByText('announcement')).toBeInTheDocument();
      expect(screen.getByText('event')).toBeInTheDocument();
      expect(screen.getByText('hackathon')).toBeInTheDocument();
    });
  });

  it('hides a post when hide button is clicked', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockNewsPosts });
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Welcome to the new semester!')).toBeInTheDocument();
    });
    
    const hideButtons = screen.getAllByTestId('VisibilityOffIcon');
    fireEvent.click(hideButtons[0].closest('button'));
    
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'hiddenNewsPosts',
      expect.stringContaining('[1]')
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
});