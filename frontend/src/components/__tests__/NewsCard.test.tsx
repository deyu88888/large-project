
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { NewsCard } from "../NewsCard";

describe("NewsCard", () => {
  const mockNews = {
    id: 1,
    title: "Test News Title",
    content: "This is the content of the news.",
  };

  it("renders the news title", () => {
    render(<NewsCard news={mockNews} />);
    expect(screen.getByText(/Test News Title/i)).toBeInTheDocument();
  });

  it("renders the news content", () => {
    render(<NewsCard news={mockNews} />);
    expect(screen.getByText(/This is the content of the news/i)).toBeInTheDocument();
  });
});