
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import NewsComment from "../NewsComment";
import * as api from "../../api"; 


vi.mock("../../api", async () => {
  const actual: typeof import("../../api") = await vi.importActual("../../api");
  return {
    ...actual,
    getNewsComments: vi.fn(),
    createNewsComment: vi.fn(),
    deleteNewsComment: vi.fn(),
    toggleLikeOnNewsComment: vi.fn(),
    toggleDislikeOnNewsComment: vi.fn(),
  };
});

describe("NewsComment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading skeletons while fetching comments", async () => {
    
    (api.getNewsComments as vi.Mock).mockImplementation(() => new Promise(() => {}));

    render(<NewsComment newsId={123} />);

    
    
    
    expect(screen.getAllByRole("progressbar")).toHaveLength(21);

    
  });

  it("shows 'No comments yet' if the API returns an empty array", async () => {
    (api.getNewsComments as vi.Mock).mockResolvedValueOnce([]);

    render(<NewsComment newsId={123} />);

    
    await waitFor(() => {
      expect(api.getNewsComments).toHaveBeenCalledWith(123);
    });

    expect(
      screen.getByText("No comments yet. Be the first to share your thoughts!")
    ).toBeInTheDocument();
    expect(screen.getByText("0 Comments")).toBeInTheDocument();
  });

  it("renders comments if present and shows the correct count", async () => {
    (api.getNewsComments as vi.Mock).mockResolvedValueOnce([
      {
        id: 1,
        user_data: { username: "Alice" },
        content: "First comment",
        created_at: new Date().toISOString(),
        likes_count: 2,
        dislikes_count: 0,
        liked_by_user: false,
        disliked_by_user: false,
        replies: [],
      },
      {
        id: 2,
        user_data: { username: "Bob" },
        content: "Second comment",
        created_at: new Date().toISOString(),
        likes_count: 1,
        dislikes_count: 1,
        liked_by_user: false,
        disliked_by_user: false,
        replies: [],
      },
    ]);

    render(<NewsComment newsId={456} />);

    
    await waitFor(() => {
      expect(api.getNewsComments).toHaveBeenCalledWith(456);
    });

    
    expect(screen.getByText("First comment")).toBeInTheDocument();
    expect(screen.getByText("Second comment")).toBeInTheDocument();
    
    expect(screen.getByText("2 Comments")).toBeInTheDocument();
  });

  it("allows posting a new comment", async () => {
    
    (api.getNewsComments as vi.Mock).mockResolvedValueOnce([]);
    
    (api.createNewsComment as vi.Mock).mockResolvedValueOnce({
      id: 99,
      user_data: { username: "User" },
      content: "Newly created comment",
      created_at: new Date().toISOString(),
      likes_count: 0,
      dislikes_count: 0,
      liked_by_user: false,
      disliked_by_user: false,
      replies: [],
    });

    render(<NewsComment newsId={789} />);

    await waitFor(() => {
      expect(api.getNewsComments).toHaveBeenCalledWith(789);
    });

    
    expect(
      screen.getByText("No comments yet. Be the first to share your thoughts!")
    ).toBeInTheDocument();

    
    const input = screen.getByPlaceholderText("Add a comment...");
    fireEvent.change(input, { target: { value: "Hello world" } });

    
    const commentBtn = screen.getByRole("button", { name: /Comment/i });
    expect(commentBtn).not.toBeDisabled();

    await act(async () => {
      fireEvent.click(commentBtn);
    });

    
    expect(api.createNewsComment).toHaveBeenCalledWith(789, {
      content: "Hello world",
      parent_comment: null,
    });

    
    await waitFor(() => {
      expect(screen.getByText("Newly created comment")).toBeInTheDocument();
    });

    
    expect(screen.getByText("1 Comment")).toBeInTheDocument();
  });
});