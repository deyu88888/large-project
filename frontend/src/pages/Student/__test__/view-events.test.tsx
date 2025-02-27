import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import { vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import ViewEvents from "../view-events";
import { apiClient } from "../../../api";

vi.mock("../../../api", () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

const theme = createTheme();

describe("ViewEvents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (apiClient.get as vi.Mock).mockImplementation((url: string) => {
      if (url === "/api/events/rsvp") {
        return Promise.resolve({
          data: [
            {
              id: 1,
              title: "Event 1",
              date: "2023-09-15",
              location: "Location A",
            },
            {
              id: 2,
              title: "Event 2",
              date: "2023-10-01",
              location: "", // No location provided, should display "TBA"
            },
          ],
        });
      }
      return Promise.resolve({ data: [] });
    });
  });

  const renderComponent = () =>
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <ViewEvents />
        </MemoryRouter>
      </ThemeProvider>
    );

  it("displays a loading indicator initially", async () => {
    (apiClient.get as vi.Mock).mockImplementationOnce(() =>
      new Promise((resolve) =>
        setTimeout(() => resolve({ data: [] }), 200)
      )
    );
    renderComponent();
    expect(screen.getByText(/Loading events.../i)).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByText(/Loading events.../i)).not.toBeInTheDocument()
    );
  });

  it("renders a list of events when available", async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText(/All Events/i)).toBeInTheDocument());
    expect(screen.getByText("Event 1")).toBeInTheDocument();
    expect(screen.getByText(/Date: 2023-09-15/i)).toBeInTheDocument();
    expect(screen.getByText(/Location: Location A/i)).toBeInTheDocument();
    expect(screen.getByText("Event 2")).toBeInTheDocument();
    expect(screen.getByText(/Date: 2023-10-01/i)).toBeInTheDocument();
    expect(screen.getByText(/Location: TBA/i)).toBeInTheDocument();
  });

  it('renders "No upcoming events." when there are no events', async () => {
    (apiClient.get as vi.Mock).mockImplementationOnce((url: string) => {
      if (url === "/api/events/rsvp") {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: [] });
    });
    renderComponent();
    await waitFor(() => expect(screen.getByText(/All Events/i)).toBeInTheDocument());
    expect(screen.getByText(/No upcoming events./i)).toBeInTheDocument();
  });

  it("logs an error if fetching events fails", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    (apiClient.get as vi.Mock).mockImplementationOnce(() =>
      Promise.reject(new Error("Fetch failed"))
    );
    renderComponent();
    await waitFor(() => expect(screen.getByText(/All Events/i)).toBeInTheDocument());
    expect(screen.getByText(/No upcoming events./i)).toBeInTheDocument();
    expect(consoleErrorSpy).toHaveBeenCalledWith("Error fetching events:", expect.any(Error));
    consoleErrorSpy.mockRestore();
  });
});
