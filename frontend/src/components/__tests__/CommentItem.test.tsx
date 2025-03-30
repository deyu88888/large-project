import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { CommentItem } from "../CommentItem";


const mockComment = {
  id: 1,
  content: "This is a test comment",
  create_at: new Date().toISOString(),
  user_data: {
    id: 100,
    username: "testuser",
    icon: "",
  },
  parent_comment: null,
  replies: [],
  likes: 2,
  dislikes: 1,
  liked_by_user: false,
  disliked_by_user: false,
};

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe("CommentItem", () => {
  it("renders comment content and username", () => {
    render(
      <CommentItem comment={mockComment} onReply={vi.fn()} />,
      { wrapper: Wrapper }
    );
    expect(screen.getByText("testuser:")).toBeInTheDocument();
    expect(screen.getByText("This is a test comment")).toBeInTheDocument();
  });

  it("toggles reply box when reply button is clicked", () => {
    render(
      <CommentItem comment={mockComment} onReply={vi.fn()} />,
      { wrapper: Wrapper }
    );

    
    const replyButton = screen.getByTestId("ChatBubbleOutlineIcon");
    fireEvent.click(replyButton);

    
    const submitButton = screen.getByRole("button", { name: /submit reply/i });
    expect(submitButton).toBeInTheDocument();
  });
});