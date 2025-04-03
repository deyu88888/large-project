import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CommentSection } from '../../../components/CommentSection';
import { apiClient } from '../../../api';
import { CommentType } from '../../../types/event/comment';
import { User } from '../../../types/user/user';

vi.mock('../../../api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('../../../components/CommentItem', () => ({
  CommentItem: ({ comment, onReply }: { comment: CommentType, onReply: (id: number, content: string) => void }) => (
    <div data-testid={`comment-item-${comment.id}`}>
      <div>{comment.content}</div>
      <div>by {comment.user_data.username}</div>
      <button
        onClick={() => onReply(comment.id, 'Test reply from mock')}
        data-testid={`reply-button-${comment.id}`}
      >
        Reply
      </button>
    </div>
  ),
}));

vi.mock('../../../components/TextToggle', () => ({
  TextToggle: ({ setSortOption, setCommentsPerPage }: { setSortOption: (opt: 'time' | 'popularity') => void, setCommentsPerPage: (num: number) => void }) => (
    <div data-testid="text-toggle">
      <button onClick={() => setSortOption('popularity')}>Sort Popular</button>
      <button onClick={() => setSortOption('time')}>Sort Time</button>
      <button onClick={() => setCommentsPerPage(5)}>Show 5</button>
      <button onClick={() => setCommentsPerPage(10)}>Show 10</button>
    </div>
  )
}));

const theme = createTheme({
  palette: {
    mode: 'light',
  }
});

describe('CommentSection Component', () => {
  const mockEventId = 123;

  const baseUserData: Omit<User, 'id' | 'username' | 'icon'> = {
    email: 'test@example.com', first_name: 'Test', last_name: 'User', is_staff: false, is_active: true,
    major: null, is_president: false, is_vice_president: false, is_event_manager: false,
    president_of: null, vice_president_of_society: null, event_manager_of_society: null, email_verified: true,
  };

  const mockComments: CommentType[] = [
    {
      id: 1, content: 'Comment One - Less Popular', create_at: '2023-01-01T12:00:00Z',
      user_data: { ...baseUserData, id: 101, username: 'testuser1', icon: 'icon1.jpg' },
      parent_comment: null, replies: [], likes: 5, dislikes: 1, liked_by_user: false, disliked_by_user: false,
    },
    {
      id: 2, content: 'Comment Two - More Popular', create_at: '2023-01-02T12:00:00Z',
      user_data: { ...baseUserData, id: 102, username: 'testuser2', icon: 'icon2.jpg' },
      parent_comment: null,
      replies: [
        {
          id: 3, content: 'A reply to the second comment', create_at: '2023-01-03T12:00:00Z',
          user_data: { ...baseUserData, id: 103, username: 'testuser3', icon: 'icon3.jpg' },
          parent_comment: 2, replies: [], likes: 3, dislikes: 0, liked_by_user: true, disliked_by_user: false,
        }
      ],
      likes: 10, dislikes: 2, liked_by_user: true, disliked_by_user: false,
    },
    {
      id: 4, content: 'Comment Three - Least Popular', create_at: '2023-01-04T12:00:00Z',
      user_data: { ...baseUserData, id: 104, username: 'testuser4', icon: 'icon4.jpg' },
      parent_comment: null, replies: [], likes: 1, dislikes: 1, liked_by_user: false, disliked_by_user: false,
    }
  ];

  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.get).mockResolvedValue({ data: [...mockComments] });
    vi.mocked(apiClient.post).mockImplementation(async (url, data: any) => ({
        data: {
          id: Date.now(),
          content: data.content, create_at: new Date().toISOString(),
          user_data: { ...baseUserData, id: 999, username: 'currentUser', icon: 'current.jpg' },
          parent_comment: data.parent_comment || null, replies: [],
          likes: 0, dislikes: 0, liked_by_user: false, disliked_by_user: false,
        }
    }));
  });

  const renderComponent = () => render(
    <ThemeProvider theme={theme}>
      <CommentSection eventId={mockEventId} />
    </ThemeProvider>
  );

  it('renders loading state initially', async () => {
    vi.mocked(apiClient.get).mockImplementationOnce(() => new Promise(resolve => {
      setTimeout(() => resolve({ data: [...mockComments] }), 50);
    }));

    renderComponent();
    expect(screen.getByText('Loading comments...')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText('Loading comments...')).not.toBeInTheDocument();
    });
  });

  it('fetches and displays comments correctly', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.queryByText('Loading comments...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Comments')).toBeInTheDocument();
    expect(screen.getByTestId('comment-item-1')).toBeInTheDocument();
    expect(screen.getByTestId('comment-item-2')).toBeInTheDocument();
    expect(screen.getByText(mockComments[0].content)).toBeInTheDocument();
    expect(screen.getByText(mockComments[1].content)).toBeInTheDocument();

    expect(apiClient.get).toHaveBeenCalledWith(`/api/comments/?event_id=${mockEventId}`);
  });

  it('displays message when no comments are available', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: [] });
    renderComponent();
    await waitFor(() => {
      expect(screen.queryByText('Loading comments...')).not.toBeInTheDocument();
    });
    expect(screen.getByText('There is no comment now')).toBeInTheDocument();
  });

  it('handles adding a new comment', async () => {
    renderComponent();
    await waitFor(() => expect(screen.queryByText('Loading comments...')).not.toBeInTheDocument());

    const textarea = screen.getByRole('textbox');
    const submitButton = screen.getByRole('button', { name: 'Post the Comment' });
    const newCommentText = 'A brand new comment';

    await user.type(textarea, newCommentText);
    await user.click(submitButton);

    await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledWith(
          `/api/comments/?event_id=${mockEventId}`,
          expect.objectContaining({
              event: mockEventId,
              content: newCommentText
          })
        );
        expect(vi.mocked(apiClient.post).mock.calls[0][1]).not.toHaveProperty('parent_comment');
    });

    expect(await screen.findByText(newCommentText)).toBeInTheDocument();
    expect(textarea).toHaveValue('');
  });

  it('prevents submitting empty comments', async () => {
    renderComponent();
    await waitFor(() => expect(screen.queryByText('Loading comments...')).not.toBeInTheDocument());

    const submitButton = screen.getByRole('button', { name: 'Post the Comment' });
    await user.click(submitButton);

    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('handles replying to an existing comment', async () => {
    renderComponent();
    await waitFor(() => expect(screen.queryByText('Loading comments...')).not.toBeInTheDocument());

    const replyButton = screen.getByTestId(`reply-button-${mockComments[0].id}`);
    await user.click(replyButton);

    await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledWith(
          `/api/comments/?event_id=${mockEventId}`,
          expect.objectContaining({
            event: mockEventId,
            content: 'Test reply from mock',
            parent_comment: mockComments[0].id
          })
        );
    });
  });

  it('sorts comments by popularity', async () => {
    renderComponent();
    await waitFor(() => expect(screen.queryByText('Loading comments...')).not.toBeInTheDocument());

    let comments = screen.getAllByTestId(/comment-item-\d+/);
    expect(comments[0]).toHaveTextContent(mockComments[0].content);
    expect(comments[1]).toHaveTextContent(mockComments[1].content);

    const sortPopularButton = screen.getByRole('button', { name: 'Sort Popular' });
    await user.click(sortPopularButton);

    await waitFor(() => {
        const sortedComments = screen.getAllByTestId(/comment-item-\d+/);
        expect(sortedComments[0]).toHaveTextContent(mockComments[1].content);
        expect(sortedComments[1]).toHaveTextContent(mockComments[0].content);
        expect(sortedComments[2]).toHaveTextContent(mockComments[2].content);
    });
 });

  it('changes comments per page', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: Array.from({ length: 15 }, (_, i) => ({
          ...mockComments[0], id: i + 1, content: `Comment ${i+1}`
      }))});

      renderComponent();
      await waitFor(() => expect(screen.queryByText('Loading comments...')).not.toBeInTheDocument());

      expect(screen.getAllByTestId(/comment-item-\d+/)).toHaveLength(10);

      const show5Button = screen.getByRole('button', { name: 'Show 5' });
      await user.click(show5Button);

      await waitFor(() => {
          expect(screen.getAllByTestId(/comment-item-\d+/)).toHaveLength(5);
      });

      const show10Button = screen.getByRole('button', { name: 'Show 10' });
      await user.click(show10Button);

      await waitFor(() => {
           expect(screen.getAllByTestId(/comment-item-\d+/)).toHaveLength(10);
      });
  });

   it('paginates comments', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: Array.from({ length: 15 }, (_, i) => ({
          ...mockComments[0], id: i + 1, content: `Comment ${i+1}`
      }))});

      renderComponent();
      await waitFor(() => expect(screen.queryByText('Loading comments...')).not.toBeInTheDocument());

      expect(screen.getByText('Comment 1')).toBeInTheDocument();
      expect(screen.getByText('Comment 10')).toBeInTheDocument();
      expect(screen.queryByText('Comment 11')).not.toBeInTheDocument();

      const page2Button = screen.getByRole('button', { name: /go to page 2/i });
      await user.click(page2Button);

      await waitFor(() => {
           expect(screen.queryByText('Comment 1')).not.toBeInTheDocument();
           expect(screen.getByText('Comment 11')).toBeInTheDocument();
           expect(screen.getByText('Comment 15')).toBeInTheDocument();
      });
   });


  it('handles API error when fetching comments', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Failed to fetch comments'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderComponent();
    await waitFor(() => {
      expect(screen.queryByText('Loading comments...')).not.toBeInTheDocument();
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error fetching comments:',
      expect.any(Error)
    );
    consoleErrorSpy.mockRestore();
  });

  it('handles API error when posting a comment', async () => {
    vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Failed to create comment'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderComponent();
    await waitFor(() => expect(screen.queryByText('Loading comments...')).not.toBeInTheDocument());

    const textarea = screen.getByRole('textbox');
    const submitButton = screen.getByRole('button', { name: 'Post the Comment' });
    await user.type(textarea, 'A new comment');
    await user.click(submitButton);

     await waitFor(() => {
       expect(consoleErrorSpy).toHaveBeenCalledWith(
         'Error creating comment:',
         expect.any(Error)
       );
    });
    consoleErrorSpy.mockRestore();
  });

  it('handles API error when replying to a comment', async () => {
    vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Failed to reply to comment'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderComponent();
    await waitFor(() => expect(screen.queryByText('Loading comments...')).not.toBeInTheDocument());

    const replyButton = screen.getByTestId(`reply-button-${mockComments[0].id}`);
    await user.click(replyButton);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error replying to comment:',
        expect.any(Error)
      );
    });
    consoleErrorSpy.mockRestore();
  });
});