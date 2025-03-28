import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import SocietyNewsManager from '../SocietyNewsManager';
import { apiClient } from '../../../api';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';


const mockNavigate = vi.fn();


vi.mock('../../../api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));


vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});


vi.mock('react-quill', () => {
  const ReactQuillMock = ({ value, onChange }) => (
    <div data-testid="quill-editor">
      <textarea 
        data-testid="mock-quill"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
  ReactQuillMock.displayName = 'ReactQuill';
  return {
    default: ReactQuillMock
  };
});


vi.mock('../../../components/NewsPublicationRequestButton', () => ({
  default: ({ newsId, onSuccess }) => (
    <button 
      data-testid="publication-request-button"
      onClick={() => onSuccess && onSuccess()}
    >
      Request Publication
    </button>
  ),
}));


const mockNews = [
  {
    id: 1,
    title: 'Test News 1',
    content: '<p>This is test news content 1</p>',
    created_at: '2023-01-01T12:00:00Z',
    updated_at: '2023-01-01T12:00:00Z',
    published_at: null,
    status: 'Draft',
    admin_notes: null,
    is_featured: false,
    is_pinned: false,
    tags: ['tag1', 'tag2'],
    view_count: 0,
    image_url: null,
    attachment_name: null,
    author_data: {
      id: 1,
      username: 'testuser',
      full_name: 'Test User',
    },
    comment_count: 0,
  },
  {
    id: 2,
    title: 'Test News 2',
    content: '<p>This is test news content 2</p>',
    created_at: '2023-01-02T12:00:00Z',
    updated_at: '2023-01-02T12:00:00Z',
    published_at: '2023-01-02T12:30:00Z',
    status: 'Published',
    admin_notes: null,
    is_featured: true,
    is_pinned: true,
    tags: ['tag3', 'tag4'],
    view_count: 10,
    image_url: 'https:
    attachment_name: 'test.pdf',
    author_data: {
      id: 1,
      username: 'testuser',
      full_name: 'Test User',
    },
    comment_count: 5,
  },
  {
    id: 3,
    title: 'Test News 3',
    content: '<p>This is test news content 3</p>',
    created_at: '2023-01-03T12:00:00Z',
    updated_at: '2023-01-03T12:00:00Z',
    published_at: null,
    status: 'Rejected',
    admin_notes: 'This post needs revision',
    is_featured: false,
    is_pinned: false,
    tags: [],
    view_count: 0,
    image_url: null,
    attachment_name: null,
    author_data: {
      id: 1,
      username: 'testuser',
      full_name: 'Test User',
    },
    comment_count: 0,
  },
];


const mockTheme = createTheme();


global.FormData = class {
  append = vi.fn();
};


const renderWithRouter = (societyId = '123') => {
  return render(
    <ThemeProvider theme={mockTheme}>
      <MemoryRouter initialEntries={[`/president-page/${societyId}/manage-society-news`]}>
        <Routes>
          <Route 
            path="/president-page/:societyId/manage-society-news" 
            element={<SocietyNewsManager />} 
          />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );
};

describe('SocietyNewsManager Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockNavigate.mockReset();
    
    (apiClient.get as jest.Mock).mockResolvedValue({ data: mockNews });
    
    
    const originalError = console.error;
    console.error = (...args) => {
      if (
        typeof args[0] === 'string' && 
        (args[0].includes('Warning: An update to') || 
         args[0].includes('not wrapped in act') ||
         args[0].includes('Function components cannot be given refs'))
      ) {
        return;
      }
      originalError(...args);
    };
  });

  afterEach(() => {
    
    vi.restoreAllMocks();
    
    cleanup();
  });

  it('renders the component and fetches news', async () => {
    renderWithRouter();
    
    
    expect(screen.getByText(/Society News Management/i)).toBeInTheDocument();
    
    
    expect(apiClient.get).toHaveBeenCalledWith('/api/society/123/news/');
    
    
    await waitFor(() => {
      expect(screen.getByText('Test News 1')).toBeInTheDocument();
      expect(screen.getByText('Test News 2')).toBeInTheDocument();
      expect(screen.getByText('Test News 3')).toBeInTheDocument();
    });
  });

  it('handles error when fetching news', async () => {
    (apiClient.get as jest.Mock).mockRejectedValue(new Error('Network error'));
    
    renderWithRouter();
    
    
    await waitFor(() => {
      expect(screen.getByText(/Society News Management/i)).toBeInTheDocument();
    });
  });

  it('displays empty state when no news', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: [] });
    
    renderWithRouter();
    
    await waitFor(() => {
      expect(screen.getByText(/No news posts found/i)).toBeInTheDocument();
      expect(screen.getByText(/Create your first news post to get started/i)).toBeInTheDocument();
    });
  });

  it('filters news based on tab selection', async () => {
    renderWithRouter();
    
    await waitFor(() => {
      expect(screen.getByText('Test News 1')).toBeInTheDocument();
    });
    
    
    const tabs = screen.getAllByRole('tab');
    fireEvent.click(tabs[1]); 
    
    
    expect(screen.queryByText('Test News 1')).not.toBeInTheDocument();
    expect(screen.getByText('Test News 2')).toBeInTheDocument();
    expect(screen.queryByText('Test News 3')).not.toBeInTheDocument();
    
    
    fireEvent.click(tabs[2]); 
    
    
    expect(screen.getByText('Test News 1')).toBeInTheDocument();
    expect(screen.queryByText('Test News 2')).not.toBeInTheDocument();
    expect(screen.queryByText('Test News 3')).not.toBeInTheDocument();
    
    
    fireEvent.click(tabs[3]); 
    
    
    expect(screen.queryByText('Test News 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Test News 2')).not.toBeInTheDocument();
    expect(screen.getByText('Test News 3')).toBeInTheDocument();
  });

  it('opens the create news form when Create News button is clicked', async () => {
    renderWithRouter();
    
    await waitFor(() => {
      expect(screen.getByText('Test News 1')).toBeInTheDocument();
    });
    
    
    fireEvent.click(screen.getByText('Create News'));
    
    
    expect(screen.getByText('Create New News Post')).toBeInTheDocument();
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.getByTestId('quill-editor')).toBeInTheDocument();
  });

  it('can view a news post', async () => {
    renderWithRouter();
    
    await waitFor(() => {
      expect(screen.getByText('Test News 1')).toBeInTheDocument();
    });
    
    
    const viewButtons = screen.getAllByText('View Details');
    fireEvent.click(viewButtons[0]);
    
    
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('can delete a news post', async () => {
    (apiClient.delete as jest.Mock).mockResolvedValue({});
    window.confirm = vi.fn(() => true); 
    
    renderWithRouter();
    
    await waitFor(() => {
      expect(screen.getByText('Test News 1')).toBeInTheDocument();
    });
    
    
    const menuButtons = screen.getAllByTestId('MoreVertIcon');
    fireEvent.click(menuButtons[0]);
    
    
    fireEvent.click(screen.getByText('Delete'));
    
    
    expect(window.confirm).toHaveBeenCalled();
    expect(apiClient.delete).toHaveBeenCalledWith('/api/news/1/');
  });

  it('can edit a news post', async () => {
    renderWithRouter();
    
    await waitFor(() => {
      expect(screen.getByText('Test News 1')).toBeInTheDocument();
    });
    
    
    const menuButtons = screen.getAllByTestId('MoreVertIcon');
    fireEvent.click(menuButtons[0]);
    
    
    fireEvent.click(screen.getByText('Edit'));
    
    
    expect(screen.getByText('Edit News Post')).toBeInTheDocument();
    
    
    const titleInput = screen.getByPlaceholderText('Enter title');
    expect(titleInput).toHaveValue('Test News 1');
  });

  it('submits the form when creating a new post', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ 
      data: { id: 4, title: 'New Post', status: 'Draft' }
    });
    
    renderWithRouter();
    
    await waitFor(() => {
      expect(screen.getByText(/Society News Management/i)).toBeInTheDocument();
    });
    
    
    fireEvent.click(screen.getByText('Create News'));
    
    
    const titleInput = screen.getByPlaceholderText('Enter title');
    fireEvent.change(titleInput, { target: { value: 'New Post Title' } });
    
    
    const quillEditor = screen.getByTestId('mock-quill');
    fireEvent.change(quillEditor, { target: { value: '<p>New post content</p>' } });
    
    
    fireEvent.click(screen.getByText('Save Draft'));
    
    
    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalled();
      
      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/society/123/news/',
        expect.any(FormData),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'multipart/form-data'
          })
        })
      );
    });
  });

  it('submits the form when editing a post', async () => {
    (apiClient.put as jest.Mock).mockResolvedValue({ 
      data: { id: 1, title: 'Updated Post', status: 'Draft' }
    });
    
    renderWithRouter();
    
    await waitFor(() => {
      expect(screen.getByText('Test News 1')).toBeInTheDocument();
    });
    
    
    const menuButtons = screen.getAllByTestId('MoreVertIcon');
    fireEvent.click(menuButtons[0]);
    
    
    fireEvent.click(screen.getByText('Edit'));
    
    
    const titleInput = screen.getByPlaceholderText('Enter title');
    fireEvent.change(titleInput, { target: { value: 'Updated Title' } });
    
    
    fireEvent.click(screen.getByText('Save Draft'));
    
    
    await waitFor(() => {
      expect(apiClient.put).toHaveBeenCalled();
      expect(apiClient.put).toHaveBeenCalledWith(
        '/api/news/1/',
        expect.any(FormData),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'multipart/form-data'
          })
        })
      );
    });
  });

  it('shows rejected news with admin notes', async () => {
    renderWithRouter();
    
    await waitFor(() => {
      expect(screen.getByText('Test News 3')).toBeInTheDocument();
    });
    
    
    const viewButtons = screen.getAllByText('View Details');
    fireEvent.click(viewButtons[2]); 
    
    
    expect(screen.getByText('This post was rejected by the admin')).toBeInTheDocument();
    expect(screen.getByText('This post needs revision')).toBeInTheDocument();
    expect(screen.getByText('Revise and Resubmit')).toBeInTheDocument();
  });

  it('can create a publication request', async () => {
    renderWithRouter();
    
    await waitFor(() => {
      expect(screen.getByText('Test News 3')).toBeInTheDocument();
    });
    
    
    const viewButtons = screen.getAllByText('View Details');
    fireEvent.click(viewButtons[2]); 
    
    
    expect(screen.getByTestId('publication-request-button')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('publication-request-button'));
    
    
    expect(apiClient.get).toHaveBeenCalledTimes(2);
  });

  it('handles the back button navigation', async () => {
    renderWithRouter();
    
    await waitFor(() => {
      expect(screen.getByText(/Society News Management/i)).toBeInTheDocument();
    });
    
    
    const backButton = screen.getByTestId('ArrowBackIcon').closest('button');
    fireEvent.click(backButton);
    
    
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('adds and removes tags', async () => {
    renderWithRouter();
    
    await waitFor(() => {
      expect(screen.getByText(/Society News Management/i)).toBeInTheDocument();
    });
    
    
    fireEvent.click(screen.getByText('Create News'));
    
    
    const tagInput = screen.getByPlaceholderText('Add a tag');
    fireEvent.change(tagInput, { target: { value: 'newtag' } });
    fireEvent.click(screen.getByText('Add'));
    
    
    expect(screen.getByText('newtag')).toBeInTheDocument();
    
    
    const deleteIcon = screen.getByTestId('CancelIcon');
    fireEvent.click(deleteIcon);
    
    
    expect(screen.queryByText('newtag')).not.toBeInTheDocument();
  });
});