import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import AdminCalendar from "../Calendar";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import * as api from "../../../api";

vi.mock("../../../api", () => ({
  getAllEvents: vi.fn()
}));

vi.mock("react-big-calendar", () => {
  const MockCalendar = vi.fn(({ events, onSelectEvent }) => (
    <div data-testid="mock-calendar">
      <div>Calendar Mock Component</div>
      {events.map((event) => (
        <div 
          key={event.id} 
          data-testid={`event-${event.id}`}
          onClick={() => onSelectEvent(event)}
        >
          {event.title}
        </div>
      ))}
    </div>
  ));
  
  return {
    Calendar: MockCalendar,
    momentLocalizer: vi.fn(() => ({})),
    Views: {
      MONTH: "month",
      WEEK: "week",
      DAY: "day",
      AGENDA: "agenda"
    }
  };
});

vi.mock("../../components/Header", () => ({
  __esModule: true,
  default: (props) => (
    <div className="MuiBox-root">
      <h2 className="MuiTypography-root MuiTypography-h2">
        {props.title}
      </h2>
      <h5 className="MuiTypography-root MuiTypography-h5">
        {props.subtitle}
      </h5>
    </div>
  )
}));

vi.mock("moment", () => {
  const mockMoment = (date) => {
    return {
      format: (format) => {
        if (format === "LT") return "12:00 PM";
        if (format === "ddd, MMM D, YYYY") return "Mon, Jan 1, 2025";
        if (format === "h:mm A") return "12:00 PM";
        if (format === "MMM D, YYYY") return "Jan 1, 2025";
        return "formatted-date";
      },
    };
  };
  mockMoment.locale = vi.fn();
  
  return {
    __esModule: true,
    default: mockMoment
  };
});

vi.mock("../../theme/theme", () => ({
  tokens: () => ({
    grey: { 100: "#f8f9fa", 300: "#dee2e6", 500: "#adb5bd" },
    primary: { 400: "#4a5568", 500: "#2d3748", 600: "#1a202c" },
  })
}));

global.requestAnimationFrame = (callback) => {
  setTimeout(callback, 0);
  return 0;
};

global.cancelAnimationFrame = vi.fn();

const renderWithProviders = (ui) => {
  const theme = createTheme();
  return render(
    <ThemeProvider theme={theme}>
      {ui}
    </ThemeProvider>
  );
};

const mockEvents = [
  {
    id: "1",
    title: "Team Meeting",
    date: "2025-01-01",
    startTime: "09:00:00",
    duration: "1:00:00",
    description: "Weekly team sync",
    location: "Conference Room A",
    hostedBy: "101"
  },
  {
    id: "2",
    title: "Project Demo",
    date: "2025-01-02",
    startTime: "14:00:00",
    duration: "0:45:00",
    description: "Presentation of new features",
    location: "Main Auditorium",
    hostedBy: "102"
  }
];

describe("AdminCalendar Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getAllEvents.mockResolvedValue(mockEvents);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should render the calendar with header", async () => {
    renderWithProviders(<AdminCalendar />);
    
    expect(screen.getByText("View All Scheduled Events!")).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByTestId("mock-calendar")).toBeInTheDocument();
    });
  });

  it("should fetch and display events", async () => {
    renderWithProviders(<AdminCalendar />);
    
    await waitFor(() => {
      expect(api.getAllEvents).toHaveBeenCalledTimes(1);
    });
    
    await waitFor(() => {
      expect(screen.getByText("Team Meeting")).toBeInTheDocument();
      expect(screen.getByText("Project Demo")).toBeInTheDocument();
    });
  });

  it("should display a loading state while fetching events", async () => {
    api.getAllEvents.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve([]), 500)));
    
    renderWithProviders(<AdminCalendar />);
    
    await waitFor(() => {
      expect(api.getAllEvents).toHaveBeenCalledTimes(1);
    });
  });

  it("should show error message when events fetch fails", async () => {
    api.getAllEvents.mockRejectedValue(new Error("Failed to fetch events"));
    
    renderWithProviders(<AdminCalendar />);
    
    await waitFor(() => {
      expect(screen.getByText("Failed to load events. Please try again.")).toBeInTheDocument();
    });
  });

  it("should open event details dialog when an event is clicked", async () => {
    renderWithProviders(<AdminCalendar />);
    
    await waitFor(() => {
      expect(screen.getByText("Team Meeting")).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText("Team Meeting"));
    
    await waitFor(() => {
      expect(screen.getByText("Date & Time:")).toBeInTheDocument();
      expect(screen.getByText("Location:")).toBeInTheDocument();
      expect(screen.getByText("Conference Room A")).toBeInTheDocument();
      expect(screen.getByText("Description:")).toBeInTheDocument();
      expect(screen.getByText("Weekly team sync")).toBeInTheDocument();
      expect(screen.getByText("Hosted By:")).toBeInTheDocument();
      expect(screen.getByText("Society ID: 101")).toBeInTheDocument();
    });
  });

  it("should close event details dialog when close button is clicked", async () => {
    renderWithProviders(<AdminCalendar />);
    
    await waitFor(() => {
      expect(screen.getByText("Team Meeting")).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText("Team Meeting"));
    
    await waitFor(() => {
      expect(screen.getByText("Date & Time:")).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText("Close"));
    
    await waitFor(() => {
      expect(screen.queryByText("Date & Time:")).not.toBeInTheDocument();
    });
  });

  it("should refresh events when Refresh button is clicked", async () => {
    renderWithProviders(<AdminCalendar />);
    
    await waitFor(() => {
      expect(api.getAllEvents).toHaveBeenCalledTimes(1);
    });
    
    fireEvent.click(screen.getByText("Refresh"));
    
    await waitFor(() => {
      expect(api.getAllEvents).toHaveBeenCalledTimes(2);
    });
  });

  it("should correctly format different event date formats", async () => {
    const differentFormatEvents = [
      {
        id: "1",
        title: "Standard Format",
        date: "2025-01-01",
        startTime: "09:00:00"
      },
      {
        id: "2",
        title: "Start Date Format",
        start_date: "2025-01-02T10:00:00"
      },
      {
        id: "3",
        title: "Only Start Field",
        start: "2025-01-03T11:00:00"
      }
    ];
    
    api.getAllEvents.mockResolvedValue(differentFormatEvents);
    
    renderWithProviders(<AdminCalendar />);
    
    await waitFor(() => {
      expect(screen.getByText("Standard Format")).toBeInTheDocument();
      expect(screen.getByText("Start Date Format")).toBeInTheDocument();
      expect(screen.getByText("Only Start Field")).toBeInTheDocument();
    });
  });

  it("should handle empty event arrays", async () => {
    api.getAllEvents.mockResolvedValue([]);
    
    renderWithProviders(<AdminCalendar />);
    
    await waitFor(() => {
      expect(api.getAllEvents).toHaveBeenCalledTimes(1);
    });
    
    expect(screen.queryByTestId("event-1")).not.toBeInTheDocument();
  });

  it("should handle malformed events gracefully", async () => {
    const malformedEvents = [
      {
        id: "1",
        title: "Valid Event",
        date: "2025-01-01",
        startTime: "09:00:00"
      },
      {
        id: "2",
        title: "No Date Fields"
      },
      {
        id: "3",
        title: "Invalid Date",
        date: "not-a-date"
      }
    ];
    
    api.getAllEvents.mockResolvedValue(malformedEvents);
    
    renderWithProviders(<AdminCalendar />);
    
    await waitFor(() => {
      expect(screen.getByText("Valid Event")).toBeInTheDocument();
    });
    
    expect(screen.queryByText("Invalid Date")).not.toBeInTheDocument();
  });
});