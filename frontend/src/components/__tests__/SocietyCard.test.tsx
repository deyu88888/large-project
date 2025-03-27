
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SocietyCard from "../SocietyCard";

describe("SocietyCard", () => {
  const mockColors = {
    primary: {
      400: "#e0e0e0",
      700: "#333333",
      800: "#222222", 
    },
    grey: {
      100: "#f5f5f5",
      200: "#eeeeee",
      300: "#cccccc",
      700: "#555555",
      800: "#444444",
      900: "#111111",
    },
    blueAccent: {
      400: "#2196f3",
      700: "#1565c0",
    },
    greenAccent: {
      400: "#4caf50",
      700: "#2e7d32",
    },
  };

  const mockSociety = {
    id: 1,
    name: "Test Society",
    icon: "https:
    category: "Sports",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    tags: ["tag1", "tag2", "tag3", "tag4"], 
  };

  it("renders society name, category, partial description, and up to 3 tags", () => {
    render(
      <SocietyCard
        society={mockSociety}
        isLight={true}
        colors={mockColors}
        onViewSociety={vi.fn()}
      />
    );

    
    expect(screen.getByText("Test Society")).toBeInTheDocument();
    
    expect(screen.getByText("Sports")).toBeInTheDocument();

    
    expect(
      screen.getByText("Lorem ipsum dolor sit amet, consectetur adipiscing elit.")
    ).toBeInTheDocument();

    
    expect(screen.getByText("tag1")).toBeInTheDocument();
    expect(screen.getByText("tag2")).toBeInTheDocument();
    expect(screen.getByText("tag3")).toBeInTheDocument();
    
    expect(screen.queryByText("tag4")).not.toBeInTheDocument();
  });

  it("truncates description if longer than 120 chars", () => {
    const longDescription =
      "A".repeat(121) + " This part won't appear except for '...'";
    const societyWithLongDesc = {
      ...mockSociety,
      description: longDescription,
    };

    render(
      <SocietyCard
        society={societyWithLongDesc}
        isLight={true}
        colors={mockColors}
        onViewSociety={vi.fn()}
      />
    );

    
    expect(
      screen.getByText(
        (content) =>
          content.startsWith("A".repeat(120)) && content.endsWith("...")
      )
    ).toBeInTheDocument();

    
    expect(screen.queryByText(" This part won't appear")).not.toBeInTheDocument();
  });

  it("displays fallback text if society.icon is missing", () => {
    const societyNoIcon = {
      ...mockSociety,
      icon: null, 
    };

    render(
      <SocietyCard
        society={societyNoIcon}
        isLight={true}
        colors={mockColors}
        onViewSociety={vi.fn()}
      />
    );

    
    expect(screen.getByText("Society Image")).toBeInTheDocument();
    
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("calls onViewSociety when the 'View Society' button is clicked", () => {
    const mockOnView = vi.fn();

    render(
      <SocietyCard
        society={mockSociety}
        isLight={true}
        colors={mockColors}
        onViewSociety={mockOnView}
      />
    );

    const button = screen.getByText("View Society");
    fireEvent.click(button);

    expect(mockOnView).toHaveBeenCalledTimes(1);
    expect(mockOnView).toHaveBeenCalledWith(1); 
  });
});