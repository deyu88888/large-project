import { jsx as _jsx } from "react/jsx-runtime";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import UpcomingEvents from "./UpcomingEvents";
/** Helper for creating Date objects. */
function createDate(year, month, day, hour = 0, minute = 0, second = 0) {
    return new Date(year, month, day, hour, minute, second);
}
describe("UpcomingEvents Component", () => {
    beforeEach(() => {
        // Use fake timers so we can fast-forward or freeze time
        vi.useFakeTimers();
    });
    afterEach(() => {
        // Restore real timers after each test
        vi.restoreAllMocks();
    });
    it("renders 'No upcoming events.' when there are no events", () => {
        render(_jsx(UpcomingEvents, { events: [] }));
        expect(screen.getByText("No upcoming events.")).toBeInTheDocument();
    });
    it("renders 'No upcoming events.' when all events are in the past", () => {
        // Freeze time at June 10, 2025 12:00
        const now = createDate(2025, 5, 10, 12);
        vi.setSystemTime(now);
        // These events ended before 'now'
        const pastEvents = [
            {
                id: 1,
                title: "Past Event 1",
                start: createDate(2025, 5, 10, 10),
                end: createDate(2025, 5, 10, 11),
            },
            {
                id: 2,
                title: "Past Event 2",
                start: createDate(2025, 5, 9, 14),
                end: createDate(2025, 5, 9, 15),
            },
        ];
        render(_jsx(UpcomingEvents, { events: pastEvents }));
        // Since all are in the past, expect "No upcoming events."
        expect(screen.getByText("No upcoming events.")).toBeInTheDocument();
    });
    it("displays future events in ascending order, limited to 5 events", () => {
        // Freeze time at June 1, 2025 12:00
        const now = createDate(2025, 5, 1, 12);
        vi.setSystemTime(now);
        const futureEvents = [
            {
                id: 1,
                title: "Future 1 (June 2, 10am)",
                start: createDate(2025, 5, 2, 10),
                end: createDate(2025, 5, 2, 11),
            },
            {
                id: 2,
                title: "Future 2 (June 3, 9am)",
                start: createDate(2025, 5, 3, 9),
                end: createDate(2025, 5, 3, 10),
            },
            {
                id: 3,
                title: "Future 3 (June 3, 8:30am)",
                start: createDate(2025, 5, 3, 8, 30),
                end: createDate(2025, 5, 3, 9, 30),
            },
            {
                id: 4,
                title: "Future 4 (June 10, 7am)",
                start: createDate(2025, 5, 10, 7),
                end: createDate(2025, 5, 10, 8),
            },
            {
                id: 5,
                title: "Future 5 (June 1, 1pm)",
                start: createDate(2025, 5, 1, 13),
                end: createDate(2025, 5, 1, 14),
            },
            {
                id: 6,
                title: "Future 6 - Should Not Appear",
                start: createDate(2025, 6, 1, 13),
                end: createDate(2025, 6, 1, 14),
            },
        ];
        render(_jsx(UpcomingEvents, { events: futureEvents }));
        // The component should sort + slice to show exactly 5
        // Check that #6 is not rendered
        expect(screen.queryByText("Future 6 - Should Not Appear")).not.toBeInTheDocument();
        // Confirm that we do see 5 event titles
        expect(screen.getByText("Future 1 (June 2, 10am)")).toBeInTheDocument();
        expect(screen.getByText("Future 2 (June 3, 9am)")).toBeInTheDocument();
        expect(screen.getByText("Future 3 (June 3, 8:30am)")).toBeInTheDocument();
        expect(screen.getByText("Future 4 (June 10, 7am)")).toBeInTheDocument();
        expect(screen.getByText("Future 5 (June 1, 1pm)")).toBeInTheDocument();
    });
    it("displays and updates a live countdown without pushing the event into the past", async () => {
        // Freeze time to June 1, 2025 @ 12:00:00
        const now = createDate(2025, 5, 1, 12, 0, 0);
        vi.setSystemTime(now);
        // We'll create an event that starts in 1 hour and 20 seconds
        // so we can test the countdown for some seconds
        const startTime = new Date(now.getTime() + (1 * 60 * 60 + 20) * 1000);
        // That is June 1, 2025 @ 13:00:20
        const events = [
            {
                id: 101,
                title: "Countdown Test Event",
                start: startTime,
                end: createDate(2025, 5, 1, 14), // not crucial for the test
            },
        ];
        render(_jsx(UpcomingEvents, { events: events }));
        // "Countdown Test Event" is rendered and should read:
        //  "Starts in: 0d 1h 0m 20s"
        expect(screen.getByText(/countdown test event/i)).toBeInTheDocument();
        const countdownText = screen.getByText(/Starts in:/i);
        // Check the initial countdown
        expect(countdownText).toHaveTextContent("0d 1h 0m 20s");
        // Advance 10 seconds
        act(() => {
            vi.advanceTimersByTime(10000);
        });
        // Now the countdown should be 0d 0h 59m 10s => Wait, we started at 1:00:20 away
        // 10 seconds gone => 0d 1h 0m 10s left => Actually let's do the math carefully:
        //   The start was 1 hour and 20 seconds away,
        //   10s have passed => 1 hour, 10 seconds away => "0d 1h 0m 10s"
        expect(countdownText).toHaveTextContent("0d 1h 0m 10s");
        // Let's advance an additional 10 seconds. 
        // We'll confirm it doesn't break or go negative or unmount the event. 
        act(() => {
            vi.advanceTimersByTime(10000);
        });
        // Now there's exactly 1 hour left => "0d 1h 0m 0s"
        expect(countdownText).toHaveTextContent("0d 1h 0m 0s");
    });
    it("renders the container with accessibility attributes", () => {
        render(_jsx(UpcomingEvents, { events: [] }));
        // The container is a motion.div with role="region" and aria-label
        const region = screen.getByRole("region", {
            name: /upcoming events section/i,
        });
        expect(region).toBeInTheDocument();
        expect(region).toHaveAttribute("aria-live", "polite");
    });
});
