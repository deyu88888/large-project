import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SocietyPreviewModal from "../SocietyPreviewModal";

describe("SocietyPreviewModal", () => {
  const formData = {
    name: "Test Society",
    category: "Test Category",
    membership_requirements: "Test Requirements",
    upcoming_projects_or_plans: "Test Projects",
    tags: ["Tag1", "Tag2"],
    social_media_links: {
      twitter: "https://twitter.com/example",
      facebook: "https://facebook.com/example",
    },
    icon: "https://example.com/icon.png",
  };

  it("renders the modal with the provided form data", () => {
    render(<SocietyPreviewModal open={true} onClose={() => {}} formData={formData} />);
    
    expect(screen.getByText("Society Preview")).toBeInTheDocument();
    expect(screen.getByText("Test Society")).toBeInTheDocument();
    expect(screen.getByText("Test Category")).toBeInTheDocument();
    expect(screen.getByText("Test Requirements")).toBeInTheDocument();
    expect(screen.getByText("Test Projects")).toBeInTheDocument();
    expect(screen.getByText("Tag1, Tag2")).toBeInTheDocument();
    expect(screen.getByText("twitter: https://twitter.com/example")).toBeInTheDocument();
    expect(screen.getByText("facebook: https://facebook.com/example")).toBeInTheDocument();
    expect(screen.getByAltText("Society icon")).toBeInTheDocument();
  });

  it("does not render the icon when no icon URL is provided", () => {
    render(
      <SocietyPreviewModal 
        open={true} 
        onClose={() => {}} 
        formData={{ ...formData, icon: undefined }} 
      />
    );
    expect(screen.queryByAltText("Society icon")).not.toBeInTheDocument();
  });

  it("calls the onClose function when the close button is clicked", () => {
    const onCloseMock = vi.fn();
    render(<SocietyPreviewModal open={true} onClose={onCloseMock} formData={formData} />);
    
    fireEvent.click(screen.getByText("Close Preview"));
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it("does not render the modal when open prop is false", () => {
    render(<SocietyPreviewModal open={false} onClose={() => {}} formData={formData} />);
    expect(screen.queryByText("Society Preview")).not.toBeInTheDocument();
  });
});