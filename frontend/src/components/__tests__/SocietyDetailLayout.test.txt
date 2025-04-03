
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SocietyDetailLayout from "../SocietyDetailLayout";

describe("SocietyDetailLayout", () => {
  const mockSociety = {
    id: 123,
    name: "Chess Club",
    icon: "https:",
    category: "Board Games",
    description: "Join us to explore the world of strategic board games!",
    tags: ["chess", "strategy", "mindgames"],
    showreel_images: [
      { photo: "https:"}
    ],
    president: {
      id: 99,
      first_name: "Alice",
      last_name: "Wonderland",
      email: "alice@example.com",
    },
    vice_president: {
      id: 100,
      first_name: "Bob",
      last_name: "Builder",
    },
    event_manager: {
      id: 101,
      first_name: "Carol",
      last_name: "Danvers",
    },
    social_media_links: {
      Facebook: "https:",
      Instagram: "",
      X: "https:",
      WhatsApp: "",
      Other: "https:"
    },
  };

  it("displays loading message if 'loading' is true", () => {
    render(
      <SocietyDetailLayout
        society={null as any}
        loading={true}
        joined={0}
        onJoinSociety={vi.fn()}
      />
    );

    expect(screen.getByText("Loading society...")).toBeInTheDocument();
  });

  it("renders society details when not loading", () => {
    render(
      <SocietyDetailLayout
        society={mockSociety as any}
        loading={false}
        joined={0}
        onJoinSociety={vi.fn()}
      />
    );

    
    expect(screen.getByText("Chess Club")).toBeInTheDocument();
    expect(screen.getByText("Board Games")).toBeInTheDocument();
    expect(
      screen.getByText("Join us to explore the world of strategic board games!")
    ).toBeInTheDocument();

    
    expect(screen.getByText("President:")).toBeInTheDocument();
    expect(screen.getByText("Alice Wonderland")).toBeInTheDocument();
    expect(screen.getByText("Vice President:")).toBeInTheDocument();
    expect(screen.getByText("Bob Builder")).toBeInTheDocument();
    expect(screen.getByText("Event Manager:")).toBeInTheDocument();
    expect(screen.getByText("Carol Danvers")).toBeInTheDocument();

    
    expect(screen.getByText("#chess, #strategy, #mindgames")).toBeInTheDocument();

    
    expect(screen.getByText("Contact us:")).toBeInTheDocument();
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
  });

  it("displays showreel images if provided", () => {
    render(
      <SocietyDetailLayout
        society={mockSociety as any}
        loading={false}
        joined={0}
        onJoinSociety={vi.fn()}
      />
    );

    
    
    const showreel1Images = screen.getAllByAltText("Showreel 1");
    expect(showreel1Images.length).toBeGreaterThan(0);

    // const showreel2Images = screen.getAllByAltText("Showreel 2");
    // expect(showreel2Images.length).toBeGreaterThan(0);

    const event1Captions = screen.getAllByText("Event 1");
    expect(event1Captions.length).toBeGreaterThan(0);
    const event2Captions = screen.getAllByText("Event 2");
    expect(event2Captions.length).toBeGreaterThan(0);
  });

  it("renders 'Join Society' button if joined=0, calls onJoinSociety on click", () => {
    const mockJoin = vi.fn();
    render(
      <SocietyDetailLayout
        society={mockSociety as any}
        loading={false}
        joined={0}
        onJoinSociety={mockJoin}
      />
    );

    const joinButton = screen.getByText("Join Society");
    expect(joinButton).toBeInTheDocument();

    fireEvent.click(joinButton);
    expect(mockJoin).toHaveBeenCalledWith(mockSociety.id);
  });

  it("renders 'Request Pending' button if joined=1 (disabled)", () => {
    render(
      <SocietyDetailLayout
        society={mockSociety as any}
        loading={false}
        joined={1}
        onJoinSociety={vi.fn()}
      />
    );

    const pendingButton = screen.getByText("Request Pending") as HTMLButtonElement;
    expect(pendingButton).toBeInTheDocument();
    expect(pendingButton.disabled).toBe(true);
  });

  it("renders social media links if provided", () => {
    render(
      <SocietyDetailLayout
        society={mockSociety as any}
        loading={false}
        joined={0}
        onJoinSociety={vi.fn()}
      />
    );

    
    const links = screen.getAllByRole("link");

    
    const fbLink = links.find(
      (link) => link.getAttribute("href") === "https:"
    );
    expect(fbLink).toBeTruthy();

    
    const xLink = links.find(
      (link) => link.getAttribute("href") === "https:"
    );
    expect(xLink).toBeTruthy();

    
    const otherLink = links.find(
      (link) => link.getAttribute("href") === "https:"
    );
    expect(otherLink).toBeTruthy();
  });
});