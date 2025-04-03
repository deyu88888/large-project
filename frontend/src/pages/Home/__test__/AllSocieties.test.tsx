import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import AllSocieties from "../AllSocieties";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { apiClient, apiPaths } from "../../../api";

vi.mock("../../../api", () => ({
  apiClient: {
    get: vi.fn()
  },
  apiPaths: {
    SOCIETY: {
      All: "/api/societies"
    }
  }
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

const mockViewSociety = vi.fn();

vi.mock("../../components/SocietyCard", () => ({
  __esModule: true,
  default: (props) => {
    const { society, onViewSociety } = props;
    
    const handleClick = (e) => {
      e.stopPropagation();
      mockViewSociety(society.id);
      onViewSociety(society.id);
    };
    
    return (
      <div 
        data-testid={`society-card-${society.id}`}
        onClick={() => {
          mockViewSociety(society.id);
          onViewSociety(society.id);
        }}
      >
        <h2>{society.name}</h2>
        <div>
          <span data-testid={`category-tag-${society.id}`}>{society.category || "General"}</span>
        </div>
        <button 
          data-testid={`view-society-${society.id}`}
          onClick={handleClick}
        >
          View Society
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

describe("AllSocieties Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockViewSociety.mockClear();
  });

  it("should render loading state initially", async () => {
    apiClient.get.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ data: [] }), 100)));
    
    renderWithProviders(<AllSocieties />);
    
    expect(screen.getByText(/loading societies/i)).toBeInTheDocument();
    await waitFor(() => expect(apiClient.get).toHaveBeenCalledWith(apiPaths.SOCIETY.All));
  });

  it("should render societies grouped by category", async () => {
    apiClient.get.mockResolvedValue({
      data: [
        { id: 1, name: "Chess Club", category: "Games" },
        { id: 2, name: "Debate Society", category: "Academic" },
        { id: 3, name: "Board Games Society", category: "Games" }
      ]
    });
    
    renderWithProviders(<AllSocieties />);
    
    await waitFor(() => {
      expect(screen.queryByText(/loading societies/i)).not.toBeInTheDocument();
    });
    
    expect(screen.getByText("Group by Category")).toBeInTheDocument();
    expect(screen.getByText("View All")).toBeInTheDocument();
    
    expect(screen.getByText("Chess Club")).toBeInTheDocument();
    expect(screen.getByText("Debate Society")).toBeInTheDocument();
    expect(screen.getByText("Board Games Society")).toBeInTheDocument();
    
    const categoryHeadings = screen.getAllByRole('heading', { level: 2 });
    expect(categoryHeadings).toHaveLength(2);
    expect(categoryHeadings[0]).toHaveTextContent("Games");
    expect(categoryHeadings[1]).toHaveTextContent("Academic");
  });

  it("should navigate to society detail page when view button is clicked", async () => {
    apiClient.get.mockResolvedValue({
      data: [{ id: 123, name: "Photography Club", category: "Arts" }]
    });
    
    renderWithProviders(<AllSocieties />);
    
    await waitFor(() => {
      expect(screen.getByText("Photography Club")).toBeInTheDocument();
    });
    

    const viewButton = screen.getByText("View Society").closest("button");
    fireEvent.click(viewButton);
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/view-society/123");
    });
  });

  it("should toggle between category view and list view", async () => {
    apiClient.get.mockResolvedValue({
      data: [
        { id: 1, name: "Chess Club", category: "Games" },
        { id: 2, name: "Debate Society", category: "Academic" }
      ]
    });
    
    renderWithProviders(<AllSocieties />);
    
    await waitFor(() => {
      expect(screen.getByText("Chess Club")).toBeInTheDocument();
    });
    
    const initialHeadings = screen.getAllByRole('heading', { level: 2 });
    expect(initialHeadings).toHaveLength(2);
    expect(initialHeadings[0]).toHaveTextContent("Games");
    expect(initialHeadings[1]).toHaveTextContent("Academic");
    
    fireEvent.click(screen.getByText("View All"));
    
    await waitFor(() => {
      expect(screen.queryAllByRole('heading', { level: 2 })).toHaveLength(0);
    });
    
    expect(screen.getByText("Chess Club")).toBeInTheDocument();
    expect(screen.getByText("Debate Society")).toBeInTheDocument();
    
    fireEvent.click(screen.getByText("Group by Category"));
    
    await waitFor(() => {
      const finalHeadings = screen.getAllByRole('heading', { level: 2 });
      expect(finalHeadings).toHaveLength(2);
      expect(finalHeadings[0]).toHaveTextContent("Games");
      expect(finalHeadings[1]).toHaveTextContent("Academic");
    });
  });

  it("should display empty state when no societies are available", async () => {
    apiClient.get.mockResolvedValue({ data: [] });
    
    renderWithProviders(<AllSocieties />);
    
    await waitFor(() => {
      expect(screen.getByText(/no societies available/i)).toBeInTheDocument();
    });
    
    expect(screen.getByText(/check back later/i)).toBeInTheDocument();
    expect(screen.queryByText("Chess Club")).not.toBeInTheDocument();
  });

  it("should display error message when API call fails", async () => {
    apiClient.get.mockRejectedValue(new Error("Network error"));
    
    renderWithProviders(<AllSocieties />);
    
    await waitFor(() => {
      expect(screen.getByText(/failed to load societies/i)).toBeInTheDocument();
    });
    
    expect(screen.queryByText("Chess Club")).not.toBeInTheDocument();
  });

  it("should handle societies with missing categories", async () => {
    apiClient.get.mockResolvedValue({
      data: [
        { id: 1, name: "Chess Club", category: "Games" },
        { id: 2, name: "Unknown Club", category: null }
      ]
    });
    
    renderWithProviders(<AllSocieties />);
    
    await waitFor(() => {
      expect(screen.getByText("Chess Club")).toBeInTheDocument();
      expect(screen.getByText("Unknown Club")).toBeInTheDocument();
    });
    
    const headings = screen.getAllByRole('heading', { level: 2 });
    expect(headings).toHaveLength(2);
    expect(headings[0]).toHaveTextContent("Games");
    expect(headings[1]).toHaveTextContent("Uncategorized");
  });

  it("should not show category toggle when only one category exists", async () => {
    apiClient.get.mockResolvedValue({
      data: [
        { id: 1, name: "Chess Club", category: "Games" },
        { id: 2, name: "Board Games Society", category: "Games" }
      ]
    });
    
    renderWithProviders(<AllSocieties />);
    
    await waitFor(() => {
      expect(screen.getByText("Chess Club")).toBeInTheDocument();
      expect(screen.getByText("Board Games Society")).toBeInTheDocument();
    });
    
    expect(screen.queryByText("Group by Category")).not.toBeInTheDocument();
    expect(screen.queryByText("View All")).not.toBeInTheDocument();
  });

  it("should render the header with correct information", async () => {
    apiClient.get.mockResolvedValue({
      data: [{ id: 1, name: "Chess Club", category: "Games" }]
    });
    
    renderWithProviders(<AllSocieties />);
    
    expect(screen.getByText("Explore Campus Societies")).toBeInTheDocument();
    expect(screen.getByText("Discover a wide range of student societies and their activities")).toBeInTheDocument();
  });
});