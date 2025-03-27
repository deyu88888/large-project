
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import NewsPublicationRequestButton from "../NewsPublicationRequestButton";
import { apiClient } from "../../api";

vi.mock("../../api", () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

describe("NewsPublicationRequestButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the button and can be disabled", () => {
    render(<NewsPublicationRequestButton newsId={123} disabled={true} />);
    const button = screen.getByRole("button", { name: /submit for approval/i });
    expect(button).toBeDisabled();
  });

  it("opens and closes the dialog on button click and cancel", async () => {
    render(<NewsPublicationRequestButton newsId={123} />);

    
    expect(
      screen.queryByText("Submit News Post for Approval")
    ).not.toBeInTheDocument();

    
    fireEvent.click(screen.getByRole("button", { name: /submit for approval/i }));
    expect(
      screen.getByText("Submit News Post for Approval")
    ).toBeInTheDocument();

    
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    
    await waitFor(() => {
      expect(
        screen.queryByText("Submit News Post for Approval")
      ).not.toBeInTheDocument();
    });
  });

  it("submits the request and calls onSuccess on success", async () => {
    (apiClient.post as vi.Mock).mockResolvedValueOnce({ data: { status: "ok" } });
    const onSuccessMock = vi.fn();

    render(<NewsPublicationRequestButton newsId={999} onSuccess={onSuccessMock} />);

    
    fireEvent.click(screen.getByRole("button", { name: /submit for approval/i }));
    
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    
    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        "/api/news/publication-request/",
        { news_post: 999 }
      );
    });

    
    expect(onSuccessMock).toHaveBeenCalled();

    
    await waitFor(() => {
      expect(
        screen.queryByText("Submit News Post for Approval")
      ).not.toBeInTheDocument();
    });
  });

  it("displays an error message if submission fails", async () => {
    (apiClient.post as vi.Mock).mockRejectedValueOnce({
      response: {
        data: { error: "Server error" },
      },
    });

    render(<NewsPublicationRequestButton newsId={888} />);

    
    fireEvent.click(screen.getByRole("button", { name: /submit for approval/i }));

    
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    
    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        "/api/news/publication-request/",
        { news_post: 888 }
      );
    });

    
    expect(screen.getByText("Error: Server error")).toBeInTheDocument();
  });
});