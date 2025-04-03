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

vi.mock('../../../components/RichTextEditor', () => {
    return {
        __esModule: true,
        default: ({ value, onChange, placeholder }) => {
        React.useEffect(() => {
            if (onChange && !value) {
            onChange('<p>Mocked default content</p>');
            }
        }, [onChange, value]);

        return (
            <div className="rich-text-editor" data-testid="mock-rich-text-editor">
            Rich Text Editor Mock Content Area
            <div className="editor-menu" style={{ display: 'none' }}>
                <div className="editor-menu-group">
                    <button type="button">Bold</button>
                    <button type="button">Italic</button>
                    <button type="button">Strike</button>
                 </div>
             </div>
            </div>
        );
        }
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
    id: 1, title: 'Test News 1', content: '<p>This is test news content 1</p>', created_at: '2023-01-01T12:00:00Z', updated_at: '2023-01-01T12:00:00Z', published_at: null, status: 'Draft', admin_notes: null, is_featured: false, is_pinned: false, tags: ['tag1', 'tag2'], view_count: 0, image_url: null, attachment_name: null, attachment_url: null, author_data: { id: 1, username: 'testuser', full_name: 'Test User' }, comment_count: 0,
  },
  {
    id: 2, title: 'Test News 2', content: '<p>This is test news content 2</p>', created_at: '2023-01-02T12:00:00Z', updated_at: '2023-01-02T12:00:00Z', published_at: '2023-01-02T12:30:00Z', status: 'Published', admin_notes: null, is_featured: true, is_pinned: true, tags: ['tag3', 'tag4'], view_count: 10, image_url: 'https://example.com/image.jpg', attachment_name: 'test.pdf', attachment_url: 'https://example.com/test.pdf', author_data: { id: 1, username: 'testuser', full_name: 'Test User' }, comment_count: 5,
  },
  {
    id: 3, title: 'Test News 3', content: '<p>This is test news content 3</p>', created_at: '2023-01-03T12:00:00Z', updated_at: '2023-01-03T12:00:00Z', published_at: null, status: 'Rejected', admin_notes: 'This post needs revision', is_featured: false, is_pinned: false, tags: [], view_count: 0, image_url: null, attachment_name: null, attachment_url: null, author_data: { id: 1, username: 'testuser', full_name: 'Test User' }, comment_count: 0,
  },
];

const mockTheme = createTheme();

global.FormData = class {
  private data = new Map();
  append(key, value) { this.data.set(key, value); }
  entries() { return this.data.entries(); }
  get(key) { return this.data.get(key); }
  has(key) { return this.data.has(key); }
};
global.alert = vi.fn();
global.confirm = vi.fn(() => true);

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
    (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockNews });
    (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: {} });
    (apiClient.put as ReturnType<typeof vi.fn>).mockResolvedValue({ data: {} });
    (apiClient.delete as ReturnType<typeof vi.fn>).mockResolvedValue({});
    window.confirm = vi.fn(() => true);

    const originalError = console.error;
    console.error = (...args) => {
      if (typeof args[0] === 'string' && (args[0].includes('Warning: An update to') || args[0].includes('not wrapped in act') || args[0].includes('Function components cannot be given refs'))) { return; }
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
    (apiClient.get as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByText(/Society News Management/i)).toBeInTheDocument();
    });
  });

  it('displays empty state when no news', async () => {
    (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [] });
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByText(/No news posts found/i)).toBeInTheDocument();
      expect(screen.getByText(/Create your first news post to get started/i)).toBeInTheDocument();
    });
  });

  it('filters news based on tab selection', async () => {
    renderWithRouter();
    await screen.findByText('Test News 1');

    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBeGreaterThan(3);

    await userEvent.click(tabs[1]);
    await waitFor(() => {
      expect(screen.queryByText('Test News 1')).not.toBeInTheDocument();
      expect(screen.getByText('Test News 2')).toBeInTheDocument();
      expect(screen.queryByText('Test News 3')).not.toBeInTheDocument();
    });

    await userEvent.click(tabs[2]);
    await waitFor(() => {
      expect(screen.getByText('Test News 1')).toBeInTheDocument();
      expect(screen.queryByText('Test News 2')).not.toBeInTheDocument();
      expect(screen.queryByText('Test News 3')).not.toBeInTheDocument();
    });

    await userEvent.click(tabs[3]);
    await waitFor(() => {
      expect(screen.queryByText('Test News 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Test News 2')).not.toBeInTheDocument();
      expect(screen.getByText('Test News 3')).toBeInTheDocument();
    });
  });

  it('can view a news post', async () => {
    renderWithRouter();
    await screen.findByText('Test News 1');

    const viewButtons = screen.getAllByRole('button', { name: /View Details/i });
    await userEvent.click(viewButtons[0]);

    expect(await screen.findByText('Edit')).toBeInTheDocument();
    expect(await screen.findByText('Delete')).toBeInTheDocument();
    expect(await screen.findByText(mockNews[0].title)).toBeInTheDocument();
     expect(screen.getByText(/This is test news content 1/)).toBeInTheDocument();
  });

  it('can delete a news post', async () => {
    (apiClient.delete as ReturnType<typeof vi.fn>).mockResolvedValue({});
    window.confirm = vi.fn(() => true);
    renderWithRouter();
    await screen.findByText('Test News 1');

    const menuButtons = await screen.findAllByTestId('MoreVertIcon');
    await userEvent.click(menuButtons[0]);
    await userEvent.click(await screen.findByRole('menuitem', { name: /Delete/i }));

    expect(window.confirm).toHaveBeenCalledTimes(1);
    expect(window.confirm).toHaveBeenCalledWith("Are you sure you want to delete this news post?");
    await waitFor(() => {
      expect(apiClient.delete).toHaveBeenCalledWith('/api/news/1/detail/');
    });
  });

   it('shows rejected news with admin notes', async () => {
    renderWithRouter();
    await screen.findByText('Test News 3');

    const viewButtons = await screen.findAllByRole('button', { name: /View Details/i });
    const post3Index = mockNews.findIndex(p => p.id === 3);
    await userEvent.click(viewButtons[post3Index]);

    expect(await screen.findByText('This post was rejected by the admin')).toBeInTheDocument();
    expect(await screen.findByText(mockNews[2].admin_notes!)).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /Revise and Resubmit/i })).toBeInTheDocument();
  });

  it('can create a publication request', async () => {
     (apiClient.get as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ data: mockNews })
        .mockResolvedValueOnce({ data: [{ ...mockNews[2], status: 'PendingApproval' }] });

    renderWithRouter();
    await screen.findByText('Test News 3');

    const viewButtons = await screen.findAllByRole('button', { name: /View Details/i });
    const post3Index = mockNews.findIndex(p => p.id === 3);
    await userEvent.click(viewButtons[post3Index]);

    const requestButton = await screen.findByTestId('publication-request-button');
    expect(requestButton).toBeInTheDocument();
    await userEvent.click(requestButton);

    await waitFor(() => expect(apiClient.get).toHaveBeenCalledTimes(2));
  });

   it('handles the back button navigation', async () => {
    renderWithRouter();
    await screen.findByText(/Society News Management/i);

    const backButton = await screen.findByTestId('ArrowBackIcon');
    await userEvent.click(backButton.closest('button')!);

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('opens the create news form basics when Create News button is clicked', async () => {
    renderWithRouter();
    await screen.findByText('Test News 1');

    await userEvent.click(screen.getByRole('button', { name: /Create News/i }));

    expect(await screen.findByText('Create New News Post')).toBeInTheDocument();
    expect(await screen.findByPlaceholderText('Enter compelling title...')).toBeInTheDocument();
    expect(await screen.findByText('Content')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /Save Draft/i })).toBeInTheDocument();
  });


   it('allows entering edit mode and checks pre-filled title', async () => {
    renderWithRouter();
    await screen.findByText('Test News 1');

    const menuButtons = await screen.findAllByTestId('MoreVertIcon');
    await userEvent.click(menuButtons[0]);
    await userEvent.click(await screen.findByRole('menuitem', { name: /Edit/i }));

    expect(await screen.findByText('Edit News Post')).toBeInTheDocument();
    const titleInput = await screen.findByPlaceholderText('Enter compelling title...');
    expect(titleInput).toHaveValue(mockNews[0].title);
    expect(await screen.findByText('Content')).toBeInTheDocument();
  });

  it('adds and removes tags when creating news', async () => {
    renderWithRouter();
    await screen.findByText('Test News 1');

    await userEvent.click(screen.getByRole('button', { name: /Create News/i }));
    expect(await screen.findByText('Create New News Post')).toBeInTheDocument();

     const tagInput = await screen.findByPlaceholderText('Add a tag...');
     const addButton = await screen.findByRole('button', { name: /Add/i });

    await userEvent.type(tagInput, 'newtag');
    expect(addButton).not.toBeDisabled();
    await userEvent.click(addButton);

    expect(await screen.findByText('newtag')).toBeInTheDocument();
    expect(tagInput).toHaveValue('');

    const chipDeleteIcon = await screen.findByTestId('CancelIcon');
    await userEvent.click(chipDeleteIcon);

    expect(screen.queryByText('newtag')).not.toBeInTheDocument();
  });

});