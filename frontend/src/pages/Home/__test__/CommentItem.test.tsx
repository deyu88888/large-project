import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi } from 'vitest';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';
import { CommentItem } from '../../../components/CommentItem';
import { apiClient } from '../../../api';
import { CommentType } from '../../../types/event/comment';
import { User } from '../../../types/user/user';

vi.mock('../../../api', () => ({
  apiClient: {
    post: vi.fn(),
  }
}));

vi.mock('date-fns', () => ({
  format: vi.fn(() => '2023-01-01 10:00')
}));

vi.mock('../../../components/HoverCard', () => ({
    HoverCard: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));


describe('CommentItem Component', () => {
    const baseUserData: Omit<User, 'id' | 'username' | 'icon'> = {
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        is_staff: false,
        is_active: true,
        major: null,
        is_president: false,
        is_vice_president: false,
        is_event_manager: false,
        president_of: null,
        vice_president_of_society: null,
        event_manager_of_society: null,
        email_verified: true,
    };

  const mockComment: CommentType = {
    id: 1,
    content: 'This is a test comment',
    create_at: '2023-01-01T10:00:00Z',
    user_data: {
      ...baseUserData,
      id: 101,
      username: 'testuser',
      icon: 'test.jpg',
    },
    parent_comment: null,
    replies: [
      {
        id: 2,
        content: 'This is a reply to the test comment',
        create_at: '2023-01-01T11:00:00Z',
        user_data: {
          ...baseUserData,
          id: 102,
          username: 'replyuser',
          icon: 'reply.jpg',
          email: 'reply@example.com',
        },
        parent_comment: 1,
        replies: [],
        likes: 5,
        dislikes: 1,
        liked_by_user: false,
        disliked_by_user: false,
      }
    ],
    likes: 10,
    dislikes: 2,
    liked_by_user: false,
    disliked_by_user: false,
  };

  const theme = createTheme({
    palette: {
      mode: 'light',
    }
  });

  const mockOnReply = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (apiClient.post as vi.Mock).mockResolvedValue({ data: { status: 'liked' } });
  });

  const setup = (comment: CommentType = mockComment, props = {}) => {
    return render(
      <MemoryRouter>
        <ThemeProvider theme={theme}>
          <CommentItem comment={comment} onReply={mockOnReply} {...props} />
        </ThemeProvider>
      </MemoryRouter>
    );
  };

  it('renders the comment content and username correctly', () => {
    setup();
    expect(screen.getByRole('link', { name: 'testuser:' })).toBeInTheDocument();
    expect(screen.getByText('This is a test comment')).toBeInTheDocument();
  });

  it.skip('renders the reply content correctly with context', () => {
    setup();
    const replyUserLink = screen.getByRole('link', { name: 'replyuser:' });
    const contextParagraph = replyUserLink.closest('p');
    expect(contextParagraph).toBeInTheDocument();

    expect(contextParagraph?.innerHTML).toContain('reply @');

    expect(replyUserLink).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'testuser:' })).toBeInTheDocument();
    expect(screen.getByText('This is a reply to the test comment')).toBeInTheDocument();
  });


  it('renders the correct number of likes for the main comment', () => {
    setup();
    const likeIcon = screen.getAllByTestId(`ThumbUpIcon`)[0];
    const likeButton = likeIcon.closest('button');
    const likeCountElement = likeButton?.nextElementSibling;
    expect(likeCountElement).toHaveTextContent('10');
  });

  it('shows the reply box when clicking the reply button', async () => {
    setup();
    const replyIcon = screen.getAllByTestId(`ChatBubbleOutlineIcon`)[0];
    const replyButton = replyIcon.closest('button');
    expect(replyButton).toBeInTheDocument();

    if (replyButton) {
      fireEvent.click(replyButton);
    }

    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit reply/i })).toBeInTheDocument();
  });

  it('handles submitting a reply correctly and hides reply box', async () => {
    setup();
    const replyIcon = screen.getAllByTestId(`ChatBubbleOutlineIcon`)[0];
    const replyButton = replyIcon.closest('button');
    expect(replyButton).toBeInTheDocument();

    if (replyButton) {
      fireEvent.click(replyButton);
    }

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'This is a test reply' } });

    const submitButton = screen.getByRole('button', { name: /submit reply/i });
    fireEvent.click(submitButton);

    expect(mockOnReply).toHaveBeenCalledWith(mockComment.id, 'This is a test reply');

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /submit reply/i })).not.toBeInTheDocument();
  });

  it('does not submit empty replies', async () => {
    setup();
    const replyIcon = screen.getAllByTestId(`ChatBubbleOutlineIcon`)[0];
    const replyButton = replyIcon.closest('button');
    expect(replyButton).toBeInTheDocument();

    if (replyButton) {
      fireEvent.click(replyButton);
    }

    const submitButton = screen.getByRole('button', { name: /submit reply/i });
    fireEvent.click(submitButton);

    expect(mockOnReply).not.toHaveBeenCalled();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('handles liking a comment correctly and updates state', async () => {
    (apiClient.post as vi.Mock).mockResolvedValueOnce({ data: { status: 'liked' } });
    setup();

    const likeIcon = screen.getAllByTestId(`ThumbUpIcon`)[0];
    const likeButton = likeIcon.closest('button');
    expect(likeButton).toBeInTheDocument();
    const likeCountElement = likeButton?.nextElementSibling;
    expect(likeCountElement).toHaveTextContent('10');

    if (likeButton) {
        await act(async () => {
          fireEvent.click(likeButton);
        });
    }

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(`/api/comments/${mockComment.id}/like/`);
    });

    const updatedLikeIcon = screen.getAllByTestId(`ThumbUpIcon`)[0];
    const updatedLikeButton = updatedLikeIcon.closest('button');
    const updatedLikeCountElement = updatedLikeButton?.nextElementSibling;
    expect(updatedLikeCountElement).toHaveTextContent('11');
  });

  it('handles disliking a comment correctly and updates state', async () => {
    (apiClient.post as vi.Mock).mockResolvedValueOnce({ data: { status: 'disliked' } });
    setup();

    const dislikeIcon = screen.getAllByTestId(`ThumbDownIcon`)[0];
    const dislikeButton = dislikeIcon.closest('button');
    expect(dislikeButton).toBeInTheDocument();

    const likeIcon = screen.getAllByTestId(`ThumbUpIcon`)[0];
    const likeButton = likeIcon.closest('button');
    const likeCountElement = likeButton?.nextElementSibling;
    expect(likeCountElement).toHaveTextContent('10');

    if (dislikeButton) {
        await act(async () => {
          fireEvent.click(dislikeButton);
        });
    }

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(`/api/comments/${mockComment.id}/dislike/`);
    });

    const updatedLikeIcon = screen.getAllByTestId(`ThumbUpIcon`)[0];
    const updatedLikeButton = updatedLikeIcon.closest('button');
    const updatedLikeCountElement = updatedLikeButton?.nextElementSibling;
    expect(updatedLikeCountElement).toHaveTextContent('10');
  });


  it('handles API error when liking', async () => {
    (apiClient.post as vi.Mock).mockRejectedValueOnce(new Error('API error'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    setup();

    const likeIcon = screen.getAllByTestId(`ThumbUpIcon`)[0];
    const likeButton = likeIcon.closest('button');
    expect(likeButton).toBeInTheDocument();

    if (likeButton) {
        await act(async () => {
          fireEvent.click(likeButton);
        });
    }

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error liking comment:', expect.any(Error));
    });

    consoleErrorSpy.mockRestore();
  });

  it('handles toggling like status correctly', async () => {
    (apiClient.post as vi.Mock)
      .mockResolvedValueOnce({ data: { status: 'liked' } })
      .mockResolvedValueOnce({ data: { status: 'removed' } });

    setup();

    const initialLikeIcon = screen.getAllByTestId(`ThumbUpIcon`)[0];
    const likeButton = initialLikeIcon.closest('button');
    expect(likeButton).toBeInTheDocument();
    const likeCountElement = likeButton?.nextElementSibling;

    if (likeButton) {
        await act(async () => { fireEvent.click(likeButton); });
    }
    await waitFor(() => { expect(likeCountElement).toHaveTextContent('11'); });
    expect(apiClient.post).toHaveBeenCalledTimes(1);
    expect(apiClient.post).toHaveBeenNthCalledWith(1, `/api/comments/${mockComment.id}/like/`);

    const currentLikeIcon = screen.getAllByTestId(`ThumbUpIcon`)[0];
    const currentLikeButton = currentLikeIcon.closest('button');
    const currentLikeCountElement = currentLikeButton?.nextElementSibling;

    if (currentLikeButton) {
        await act(async () => { fireEvent.click(currentLikeButton); });
    }
    await waitFor(() => { expect(currentLikeCountElement).toHaveTextContent('10'); });
    expect(apiClient.post).toHaveBeenCalledTimes(2);
    expect(apiClient.post).toHaveBeenNthCalledWith(2, `/api/comments/${mockComment.id}/like/`);

  });

  it('shows more replies when "Show more" is clicked', async () => {
      const commentWithManyReplies: CommentType = {
          ...mockComment,
          replies: Array.from({ length: 5 }, (_, i) => ({
              id: 10 + i,
              content: `Reply ${i + 1}`,
              create_at: `2023-01-0${i + 2}T10:00:00Z`,
              user_data: { ...baseUserData, id: 200 + i, username: `user${i}`, icon: `user${i}.jpg` },
              parent_comment: 1,
              replies: [],
              likes: i, dislikes: 0, liked_by_user: false, disliked_by_user: false,
          }))
      };
      setup(commentWithManyReplies);

      expect(screen.getByText('Reply 1')).toBeInTheDocument();
      expect(screen.getByText('Reply 2')).toBeInTheDocument();
      expect(screen.getByText('Reply 3')).toBeInTheDocument();
      expect(screen.queryByText('Reply 4')).not.toBeInTheDocument();
      const showMoreButton = screen.getByRole('button', { name: /show more/i });
      expect(showMoreButton).toBeInTheDocument();

      fireEvent.click(showMoreButton);

      await waitFor(() => {
          expect(screen.getByText('Reply 4')).toBeInTheDocument();
      });
      expect(screen.getByText('Reply 5')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /show more/i })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /show less/i })).toBeInTheDocument();
  });

});