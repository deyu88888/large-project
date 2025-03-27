
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RecommendationFeedback from "../RecommendationFeedback";
import { getRecommendationFeedback, submitRecommendationFeedback } from "../../api";

vi.mock("../../api", () => ({
  getRecommendationFeedback: vi.fn(),
  submitRecommendationFeedback: vi.fn(),
}));


describe("RecommendationFeedback", { timeout: 15000 }, () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockColours = {
    grey: {
      300: "#cccccc",
      700: "#555555",
      200: "#dddddd",
      100: "#f2f2f2",
      900: "#1a1a1a",
    },
    primary: {
      600: "#222",
    },
    blueAccent: {
      200: "#aaddff",
      400: "#3399ff",
      500: "#0077cc",
      700: "#005599",
    },
    greenAccent: {
      400: "#66cc66",
      500: "#44aa44",
    },
  };

  it("renders rating stars when no existing feedback found", async () => {
    (getRecommendationFeedback as vi.Mock).mockResolvedValueOnce(null);

    render(
      <RecommendationFeedback
        societyId={101} 
        isLight={true}
        colours={mockColours}
      />
    );

    
    await waitFor(() => {
      expect(getRecommendationFeedback).toHaveBeenCalledWith(101);
    });

    
    expect(
      screen.getByText("Was this recommendation helpful?")
    ).toBeInTheDocument();

    
    
    const stars = screen.getAllByRole("button");
    expect(stars).toHaveLength(5);
  });

  it("remains hidden if existing feedback found in server response", async () => {
    (getRecommendationFeedback as vi.Mock).mockResolvedValueOnce({
      rating: 4,
      relevance: 4,
      comment: "Already gave feedback",
    });

    render(
      <RecommendationFeedback
        societyId={102} 
        isLight={true}
        colours={mockColours}
      />
    );

    await waitFor(() => {
      expect(getRecommendationFeedback).toHaveBeenCalledWith(102);
    });

    
    
    expect(
      screen.queryByText("Was this recommendation helpful?")
    ).not.toBeInTheDocument();
  });

  it("displays the feedback form after clicking on a rating", async () => {
    (getRecommendationFeedback as vi.Mock).mockResolvedValueOnce(null);

    render(
      <RecommendationFeedback
        societyId={103} 
        isLight={false}
        colours={mockColours}
      />
    );

    await waitFor(() => {
      expect(getRecommendationFeedback).toHaveBeenCalledWith(103);
    });

    
    const starButtons = screen.getAllByRole("button");
    expect(starButtons).toHaveLength(5);

    
    fireEvent.click(starButtons[3]);

    
    expect(
      screen.getByText("How relevant was this recommendation?")
    ).toBeInTheDocument();
    expect(screen.getByText("Submit Feedback")).toBeInTheDocument();
  });

  it("submits feedback and eventually hides the component with a thank you", async () => {
    (getRecommendationFeedback as vi.Mock).mockResolvedValueOnce(null);
    (submitRecommendationFeedback as vi.Mock).mockResolvedValueOnce({
      rating: 5,
      relevance: 3,
      comment: "",
    });

    render(
      <RecommendationFeedback
        societyId={104} 
        isLight={true}
        colours={mockColours}
      />
    );

    
    await waitFor(() => {
      expect(getRecommendationFeedback).toHaveBeenCalledWith(104);
    });

    
    const stars = screen.getAllByRole("button");
    
    fireEvent.click(stars[2]); 

    
    const submitBtn = screen.getByText("Submit Feedback");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(submitRecommendationFeedback).toHaveBeenCalledWith(
        104,
        expect.objectContaining({
          rating: 3,
          relevance: 3,
        })
      );
    });

    
    expect(screen.getByText("Feedback submitted!")).toBeInTheDocument();

    
    await new Promise((r) => setTimeout(r, 6000));

    
    expect(
      screen.queryByText("Feedback submitted!")
    ).not.toBeInTheDocument();
  });

  it("handles error on submission gracefully", async () => {
    (getRecommendationFeedback as vi.Mock).mockResolvedValueOnce(null);
    (submitRecommendationFeedback as vi.Mock).mockRejectedValueOnce(
      new Error("Network error")
    );

    render(
      <RecommendationFeedback
        societyId={105} 
        isLight={true}
        colours={mockColours}
      />
    );

    await waitFor(() => {
      expect(getRecommendationFeedback).toHaveBeenCalledWith(105);
    });

    
    const starButtons = screen.getAllByRole("button");
    fireEvent.click(starButtons[4]);

    
    fireEvent.click(screen.getByText("Submit Feedback"));

    await waitFor(() => {
      expect(submitRecommendationFeedback).toHaveBeenCalled();
    });

    
    expect(screen.getByText("Submit Feedback")).toBeInTheDocument();
  });
});