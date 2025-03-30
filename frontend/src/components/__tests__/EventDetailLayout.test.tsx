import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { EventDetailLayout } from "../EventDetailLayout";
import { BrowserRouter } from "react-router-dom";


const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

const mockEventData = {
  title: "Sample Event",
  main_description: "This is the main description.",
  date: "2025-04-01",
  start_time: "12:00",
  duration: "2 hours",
  location: "London",
  max_capacity: 100,
  cover_image_url: "https:
  extra_modules: [],
  participant_modules: [],
  is_participant: false,
  is_member: true,
  event_id: 123,
  hosted_by: 99,
  current_attendees: [],
};

describe("EventDetailLayout", () => {
  it("renders event title, description, and details", () => {
    renderWithRouter(<EventDetailLayout eventData={mockEventData} />);
    
    expect(screen.getByText("Sample Event")).toBeInTheDocument();
    expect(screen.getByText("This is the main description.")).toBeInTheDocument();
    expect(screen.getByText("Date:")).toBeInTheDocument();
    expect(screen.getByText("Time:")).toBeInTheDocument();
    expect(screen.getByText("Location:")).toBeInTheDocument();
  });

  it("shows Join Event button if user is a member but not a participant", () => {
    renderWithRouter(<EventDetailLayout eventData={mockEventData} />);
    
    expect(screen.getByText("Join Event")).toBeInTheDocument();
  });

  it("shows Join Society button if user is not a member", () => {
    const notMemberData = { ...mockEventData, is_member: false };
    renderWithRouter(<EventDetailLayout eventData={notMemberData} />);
    
    expect(screen.getByText("Join Society to RSVP")).toBeInTheDocument();
  });

  it("shows Cancel RSVP if user is a participant", () => {
    const participantData = { ...mockEventData, is_participant: true };
    renderWithRouter(<EventDetailLayout eventData={participantData} />);
    
    expect(screen.getByText("Cancel RSVP")).toBeInTheDocument();
  });
});