import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

/*
  1) We partially mock 'react-big-calendar' so that we keep the original exports
     (including 'momentLocalizer'), but override the 'Calendar' component 
     to avoid RBC's actual DOM in tests.
*/
vi.mock("react-big-calendar", async () => {
  const actual = await vi.importActual<typeof import("react-big-calendar")>(
    "react-big-calendar"
  );

  return {
    __esModule: true,
    ...actual,
    // Mock just the Calendar component
    Calendar: vi.fn((props) => {
      const { events = [] } = props;
      return (
        <div data-testid="mock-calendar">
          {events.map((evt: any, idx: number) => (
            <div key={idx} data-testid="mock-event">
              {evt.title}
            </div>
          ))}
        </div>
      );
    }),
  };
});

// Now that we've mocked RBC, we can import from it if needed:
import { Calendar } from "react-big-calendar";

// Import your actual component
import EventCalendar from "../EventCalendar";

/** Helper to create date objects for testing */
function createDate(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0
) {
  return new Date(year, month, day, hour, minute);
}

describe("EventCalendar (Vitest) - Partial RBC Mock", () => {
  beforeEach(() => {
    // Reset mock call counts before each test
    vi.clearAllMocks();
  });

  it("renders the mocked Calendar and keeps the real momentLocalizer", () => {
    // Provide some test events
    const events = [
      {
        title: "Test Event 1",
        start: createDate(2025, 1, 10, 10, 0),
        end: createDate(2025, 1, 10, 11, 0),
      },
    ];

    render(<EventCalendar events={events} />);

    // RBC's Calendar is mocked; it renders <div data-testid="mock-calendar">
    const mockCalendar = screen.getByTestId("mock-calendar");
    expect(mockCalendar).toBeInTheDocument();

    // The RBC Calendar function was called exactly once
    expect(Calendar).toHaveBeenCalledTimes(1);

    // Our mock prints the event titles
    expect(screen.getByText("Test Event 1")).toBeInTheDocument();
  });

  it("passes the correct default props to the RBC Calendar", () => {
    render(<EventCalendar events={[]} />);

    // RBC's mocked Calendar was called
    expect(Calendar).toHaveBeenCalledTimes(1);

    // Get the props that our component passed to RBC's Calendar
    const callProps = (Calendar as unknown as vi.Mock).mock.calls[0][0];

    // dayLayoutAlgorithm should be "no-overlap"
    expect(callProps.dayLayoutAlgorithm).toBe("no-overlap");

    // Should enable multiple views
    expect(callProps.views).toEqual(["month", "week", "day", "agenda"]);

    // The custom "Agenda" label
    expect(callProps.messages).toEqual({ agenda: "Agenda" });

    // The time range formatting override (returns empty string)
    expect(callProps.formats.eventTimeRangeFormat()).toBe("");

    // 'startAccessor' and 'endAccessor'
    expect(callProps.startAccessor).toBe("start");
    expect(callProps.endAccessor).toBe("end");

    // Check the min/max time constraints
    expect(callProps.min.getHours()).toBe(8);
    expect(callProps.min.getMinutes()).toBe(0);

    expect(callProps.max.getHours()).toBe(23);
    expect(callProps.max.getMinutes()).toBe(0);

    // Custom styling function assigned
    expect(callProps.eventPropGetter).toBeInstanceOf(Function);
  });

  it("renders multiple events correctly via the mock", () => {
    const events = [
      {
        title: "Event A",
        start: createDate(2025, 2, 1, 9, 30),
        end: createDate(2025, 2, 1, 10, 0),
      },
      {
        title: "Event B",
        start: createDate(2025, 2, 2, 11, 0),
        end: createDate(2025, 2, 2, 12, 0),
      },
    ];

    render(<EventCalendar events={events} />);

    // The mock prints each event title in data-testid="mock-event"
    expect(screen.getByText("Event A")).toBeInTheDocument();
    expect(screen.getByText("Event B")).toBeInTheDocument();
  });

  it("applies the custom style logic for events (eventPropGetter)", () => {
    const events = [
      {
        title: "Zero Duration",
        start: createDate(2025, 2, 10, 10, 0),
        end: createDate(2025, 2, 10, 10, 0), // same start/end => 0 duration
      },
      {
        title: "Normal Event",
        start: createDate(2025, 2, 10, 10, 0),
        end: createDate(2025, 2, 10, 10, 30),
      },
    ];

    render(<EventCalendar events={events} />);

    // Check the RBC call
    const callProps = (Calendar as unknown as vi.Mock).mock.calls[0][0];
    const { eventPropGetter } = callProps;
    expect(eventPropGetter).toBeInstanceOf(Function);

    // Zero-duration event => minHeight = 30
    const zeroEvent = events[0];
    const zeroStyle = eventPropGetter(
      zeroEvent,
      zeroEvent.start,
      zeroEvent.end,
      false
    );
    expect(zeroStyle.style.backgroundColor).toBe("#6c5ce7");
    expect(zeroStyle.style.minHeight).toBe(30);

    // Normal event => no minHeight
    const normalEvent = events[1];
    const normalStyle = eventPropGetter(
      normalEvent,
      normalEvent.start,
      normalEvent.end,
      false
    );
    expect(normalStyle.style.minHeight).toBeUndefined();
  });

  it("uses the custom event component (CustomEvent) to display title and times", () => {
    // We'll confirm that 'components.event' is passed to RBC
    // Then we can directly render that component to test it.
    const events = [
      {
        title: "Morning Meeting",
        start: createDate(2025, 2, 10, 9, 0),
        end: createDate(2025, 2, 10, 9, 30),
      },
    ];

    render(<EventCalendar events={events} />);
    const callProps = (Calendar as unknown as vi.Mock).mock.calls[0][0];
    // RBC 'components.event' => Our CustomEvent component
    expect(callProps.components).toBeDefined();
    expect(callProps.components.event).toBeDefined();
    const CustomEventComponent = callProps.components.event;

    // Render the custom event in isolation
    const { container } = render(
      <CustomEventComponent event={events[0]} />
    );

    // The custom event displays:
    //  - Title in a <strong> block
    //  - Start/End times in a <span> block, using moment.format("LT") e.g. "9:00 AM - 9:30 AM"
    expect(container.querySelector("strong")).toHaveTextContent("Morning Meeting");
    expect(container).toHaveTextContent("9:00 AM");
    expect(container).toHaveTextContent("9:30 AM");
  });
});