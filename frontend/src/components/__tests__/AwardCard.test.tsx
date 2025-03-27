
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ThemeProvider, createTheme } from "@mui/material";
import AwardCard from "../AwardCard";

const renderWithTheme = (ui: React.ReactElement) => {
  const theme = createTheme({ palette: { mode: "light" } });
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe("AwardCard", () => {
  const mockAward = {
    id: 1,
    award: {
      title: "Top Performer",
      description: "Awarded for outstanding performance",
      rank: "Gold",
    },
  };

  it("renders title, description, and rank", () => {
    renderWithTheme(<AwardCard award={mockAward} />);
    expect(screen.getByText("Top Performer")).toBeInTheDocument();
    expect(screen.getByText("Awarded for outstanding performance")).toBeInTheDocument();
    expect(screen.getByText("Gold Award")).toBeInTheDocument();
  });

  it("renders the trophy icon", () => {
    renderWithTheme(<AwardCard award={mockAward} />);
    const icon = screen.getByTestId("award-icon");
    expect(icon).toBeInTheDocument();
  });
});