import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import Dashboard from "../Dashboard";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import * as api from "../../../api";

vi.mock("../../../api", () => ({
  getPopularSocieties: vi.fn(),
  getUpcomingEvents: vi.fn()
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

vi.mock("../../../utils/mapper", () => ({
  mapToEventData: (event) => ({
    eventId: event.id,
    title: event.name,
    date: event.date,
    location: event.location,
    societyId: event.societyId,
    societyName: event.societyName
  })
}));

vi.mock("../../components/SocietyCard", () => ({
  __esModule: true,
  default: (props) => {
    const { society, onViewSociety } = props;
    
    return (
      <div 
        className="MuiBox-root"
        id={`society-card-${society.id}`}
        onClick={() => onViewSociety(society.id)}
      >
        <h3>{society.name}</h3>
        <p>{society.description || "No description available"}</p>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onViewSociety(society.id);
          }}
        >
          View Society
        </button>
      </div>
    );
  }
}));

vi.mock("../../components/EventCard", () => ({
  __esModule: true,
  default: (props) => {
    const { event, onViewEvent } = props;
    
    return (
      <div 
        className="MuiBox-root"
        id={`event-card-${event.eventId}`}
        onClick={() => onViewEvent(event.eventId)}
      >
        <h3>{event.title}</h3>
        <p>{event.date} | {event.location}</p>
        <p>Organized by: {event.societyName}</p>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onViewEvent(event.eventId);
          }}
        >
          View Event
        </button>
      </div>
    );
  }
}));

vi.mock("../../theme/theme", () => ({
  tokens: (mode) => ({
    grey: { 100: "#ccc", 200: "#bbb", 300: "#aaa", 400: "#999", 700: "#777", 800: "#111" },
    redAccent: { 300: "#ff6666", 400: "#ff0000" },
    greenAccent: { 400: "#00cc00", 600: "#009900" },
    primary: { 400: "#444444", 700: "#222222" }
  })
}));

const renderWithProviders = (ui) => {
  const theme = createTheme({ palette: { mode: "light" } });
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>{ui}</ThemeProvider>
    </BrowserRouter>
  );
};

describe("Dashboard Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render loading states initially", () => {
    api.getPopularSocieties.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve([]), 100)));
    api.getUpcomingEvents.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve([]), 100)));
    
    renderWithProviders(<Dashboard />);
    
    expect(screen.getByText(/loading popular societies/i)).toBeInTheDocument();
    expect(screen.getByText(/loading upcoming events/i)).toBeInTheDocument();
  });

  it("should render societies and events when data is loaded", async () => {
    const mockSocieties = [
      { id: 1, name: "Chess Club", category: "Games" },
      { id: 2, name: "Debate Society", category: "Academic" }
    ];
    
    const mockEvents = [
      { 
        id: 101, 
        name: "Chess Tournament", 
        date: "2025-04-15", 
        location: "Student Center", 
        societyId: 1,
        societyName: "Chess Club"
      },
      { 
        id: 102, 
        name: "Debate Competition", 
        date: "2025-04-20", 
        location: "Lecture Hall A", 
        societyId: 2,
        societyName: "Debate Society"
      }
    ];
    
    api.getPopularSocieties.mockResolvedValue(mockSocieties);
    api.getUpcomingEvents.mockResolvedValue(mockEvents);
    
    renderWithProviders(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.queryByText(/loading popular societies/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/loading upcoming events/i)).not.toBeInTheDocument();
    });
    
    expect(screen.getByText("Chess Club")).toBeInTheDocument();
    expect(screen.getByText("Debate Society")).toBeInTheDocument();
    expect(screen.getByText("Chess Tournament")).toBeInTheDocument();
    expect(screen.getByText("Debate Competition")).toBeInTheDocument();
  });

  it("should navigate to society detail page when View Society is clicked", async () => {
    const mockSocieties = [
      { id: 1, name: "Chess Club", category: "Games" }
    ];
    
    api.getPopularSocieties.mockResolvedValue(mockSocieties);
    api.getUpcomingEvents.mockResolvedValue([]);
    
    renderWithProviders(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText("Chess Club")).toBeInTheDocument();
    });
    
    const societyCard = screen.getByText("Chess Club").closest(".MuiBox-root");
    const viewButton = within(societyCard).getByText("View Society");
    fireEvent.click(viewButton);
    
    expect(mockNavigate).toHaveBeenCalledWith("/view-society/1");
  });

  it("should navigate to event detail page when View Event is clicked", async () => {
    const mockEvents = [
      { 
        id: 101, 
        name: "Chess Tournament", 
        date: "2025-04-15", 
        location: "Student Center", 
        societyId: 1,
        societyName: "Chess Club"
      }
    ];
    
    api.getPopularSocieties.mockResolvedValue([]);
    api.getUpcomingEvents.mockResolvedValue(mockEvents);
    
    renderWithProviders(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText("Chess Tournament")).toBeInTheDocument();
    });
    
    const eventCard = screen.getByText("Chess Tournament").closest(".MuiBox-root");
    const viewButton = within(eventCard).getByText("View Event");
    fireEvent.click(viewButton);
    
    expect(mockNavigate).toHaveBeenCalledWith("/event/101");
  });

  it("should display error message when societies API call fails", async () => {
    api.getPopularSocieties.mockRejectedValue(new Error("Network error"));
    api.getUpcomingEvents.mockResolvedValue([]);
    
    renderWithProviders(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/error: network error/i)).toBeInTheDocument();
    });
    
    expect(screen.queryByText("Chess Club")).not.toBeInTheDocument();
  });

  it("should display error message when events API call fails", async () => {
    api.getPopularSocieties.mockResolvedValue([]);
    api.getUpcomingEvents.mockRejectedValue(new Error("Server error"));
    
    renderWithProviders(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/error: server error/i)).toBeInTheDocument();
    });
    
    expect(screen.queryByText("Chess Tournament")).not.toBeInTheDocument();
  });

  it("should display empty message when no societies are available", async () => {
    api.getPopularSocieties.mockResolvedValue([]);
    api.getUpcomingEvents.mockResolvedValue([]);
    
    renderWithProviders(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/no popular societies available/i)).toBeInTheDocument();
    });
  });

  it("should display empty message when no events are available", async () => {
    api.getPopularSocieties.mockResolvedValue([]);
    api.getUpcomingEvents.mockResolvedValue([]);
    
    renderWithProviders(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/no upcoming events available/i)).toBeInTheDocument();
    });
  });

  it("should render section headings and descriptive text", async () => {
    api.getPopularSocieties.mockResolvedValue([]);
    api.getUpcomingEvents.mockResolvedValue([]);
    
    renderWithProviders(<Dashboard />);
    
    expect(screen.getByText("Check Our Upcoming Events!")).toBeInTheDocument();
    expect(screen.getByText("Latest Trending Societies!")).toBeInTheDocument();
    expect(screen.getByText(/join us for exciting gatherings/i)).toBeInTheDocument();
    expect(screen.getByText(/discover our diverse range/i)).toBeInTheDocument();
  });
});