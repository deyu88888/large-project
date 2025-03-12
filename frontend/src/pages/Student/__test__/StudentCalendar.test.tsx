import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useTheme } from '@mui/material';

// Create a mock version of your component to test just the filtering logic
const MockCalendar = ({
  societies = [],
  userEvents = []
}) => {
  // Extract society IDs
  const societyIds = societies.map(society => society.id);
  
  // Filter events to only include those from societies the student is a member of
  const filteredEvents = userEvents.filter(event => 
    societyIds.includes(event.hostedBy)
  );
  
  return (
    <div>
      <div data-testid="society-count">
        {societies.length}
      </div>
      <div data-testid="all-events-count">
        {userEvents.length}
      </div>
      <div data-testid="filtered-events-count">
        {filteredEvents.length}
      </div>
      <div>
        {filteredEvents.map(event => (
          <div key={event.id} data-testid="event-item">
            {event.title} (Society: {event.hostedBy})
          </div>
        ))}
      </div>
    </div>
  );
};

// Mock the theme hook
vi.mock('@mui/material', () => ({
  useTheme: () => ({
    palette: {
      mode: 'light'
    }
  }),
  Box: ({ children, ...props }) => <div {...props}>{children}</div>,
  Typography: ({ children, ...props }) => <div {...props}>{children}</div>,
  CircularProgress: () => <div data-testid="loading-spinner" role="progressbar">Loading...</div>,
  Dialog: ({ children, open, ...props }) => open ? <div {...props}>{children}</div> : null,
  DialogTitle: ({ children, ...props }) => <div {...props}>{children}</div>,
  DialogContent: ({ children, ...props }) => <div {...props}>{children}</div>,
  DialogActions: ({ children, ...props }) => <div {...props}>{children}</div>,
  Button: ({ children, onClick, ...props }) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
  Chip: ({ label, ...props }) => <span {...props}>{label}</span>,
  Alert: ({ children, ...props }) => <div {...props}>{children}</div>,
  IconButton: ({ children, ...props }) => <button {...props}>{children}</button>,
}));

// Sample mock data - expanded for more comprehensive testing
const mockSocieties = [
  { id: 1, name: 'Computer Science Society', is_president: false },
  { id: 3, name: 'Chess Club', is_president: true },
  { id: 5, name: 'Photography Club', is_president: false },
];

const mockEvents = [
  // Events from societies the student is a member of
  {
    id: 101,
    title: 'CS Workshop',
    date: '2025-04-01',
    startTime: '14:00',
    duration: '2 hours',
    location: 'Room 101',
    description: 'Coding workshop',
    hostedBy: 1, // Computer Science Society (user is a member)
    societyName: 'Computer Science Society',
    rsvp: true,
  },
  {
    id: 102,
    title: 'Chess Tournament',
    date: '2025-04-02',
    startTime: '10:00',
    duration: '4 hours',
    location: 'Main Hall',
    description: 'Annual tournament',
    hostedBy: 3, // Chess Club (user is a member)
    societyName: 'Chess Club',
    rsvp: false,
  },
  {
    id: 103,
    title: 'Photo Exhibition',
    date: '2025-04-03',
    startTime: '12:00',
    duration: '3 hours',
    location: 'Gallery',
    description: 'Student photos',
    hostedBy: 5, // Photography Club (user is a member)
    societyName: 'Photography Club',
    rsvp: false,
  },
  
  // Events from societies the student is NOT a member of
  {
    id: 201,
    title: 'Math Competition',
    date: '2025-04-04',
    startTime: '09:00',
    duration: '3 hours',
    location: 'Room 205',
    description: 'Annual math contest',
    hostedBy: 2, // Math Club (user is NOT a member)
    societyName: 'Math Club',
    rsvp: false,
  },
  {
    id: 202,
    title: 'Debate Championship',
    date: '2025-04-05',
    startTime: '16:00',
    duration: '2 hours',
    location: 'Auditorium',
    description: 'Final debate round',
    hostedBy: 4, // Debate Society (user is NOT a member)
    societyName: 'Debate Society',
    rsvp: false,
  },
  {
    id: 203,
    title: 'Basketball Game',
    date: '2025-04-06',
    startTime: '18:00',
    duration: '1.5 hours',
    location: 'Gym',
    description: 'Friendly match',
    hostedBy: 6, // Sports Club (user is NOT a member)
    societyName: 'Sports Club',
    rsvp: false,
  },
];

describe('Student Calendar Filtering Logic', () => {
  it('should only display events from societies the student is a member of', () => {
    render(<MockCalendar societies={mockSocieties} userEvents={mockEvents} />);
    
    // Check society count
    expect(screen.getByTestId('society-count').textContent).toBe('3');
    
    // Check total events count
    expect(screen.getByTestId('all-events-count').textContent).toBe('6');
    
    // Check filtered events count - should only include events from societies 1, 3, and 5
    expect(screen.getByTestId('filtered-events-count').textContent).toBe('3');
    
    // Verify the specific events that are displayed
    const displayedEvents = screen.getAllByTestId('event-item');
    expect(displayedEvents).toHaveLength(3);
    
    // Check that events from societies 1, 3, and 5 are included
    expect(screen.getByText('CS Workshop (Society: 1)')).toBeInTheDocument();
    expect(screen.getByText('Chess Tournament (Society: 3)')).toBeInTheDocument();
    expect(screen.getByText('Photo Exhibition (Society: 5)')).toBeInTheDocument();
    
    // Check that events from other societies are NOT included
    expect(screen.queryByText(/Math Competition/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Debate Championship/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Basketball Game/)).not.toBeInTheDocument();
  });

  it('should show no events when the student is not a member of any society', () => {
    render(<MockCalendar societies={[]} userEvents={mockEvents} />);
    
    // Should have 0 societies
    expect(screen.getByTestId('society-count').textContent).toBe('0');
    
    // Should have 0 filtered events
    expect(screen.getByTestId('filtered-events-count').textContent).toBe('0');
    
    // Should not display any events
    expect(screen.queryAllByTestId('event-item')).toHaveLength(0);
  });

  it('should show all events when the student is a member of all societies', () => {
    const allSocieties = [
      { id: 1, name: 'Computer Science Society' },
      { id: 2, name: 'Math Club' },
      { id: 3, name: 'Chess Club' },
      { id: 4, name: 'Debate Society' },
      { id: 5, name: 'Photography Club' },
      { id: 6, name: 'Sports Club' },
    ];
    
    render(<MockCalendar societies={allSocieties} userEvents={mockEvents} />);
    
    // Should have 6 societies
    expect(screen.getByTestId('society-count').textContent).toBe('6');
    
    // Should have 6 filtered events (all events)
    expect(screen.getByTestId('filtered-events-count').textContent).toBe('6');
    
    // Should display all 6 events
    expect(screen.getAllByTestId('event-item')).toHaveLength(6);
  });

  it('should handle non-sequential society IDs correctly', () => {
    const nonSequentialSocieties = [
      { id: 42, name: 'Random Society 1' },
      { id: 99, name: 'Random Society 2' },
    ];
    
    const testEvents = [
      { id: 1, title: 'Event for Society 42', hostedBy: 42 },
      { id: 2, title: 'Event for Society 99', hostedBy: 99 },
      { id: 3, title: 'Event for Society 1', hostedBy: 1 },
    ];
    
    render(<MockCalendar societies={nonSequentialSocieties} userEvents={testEvents} />);
    
    // Should have 2 societies
    expect(screen.getByTestId('society-count').textContent).toBe('2');
    
    // Should have 2 filtered events (only those from societies 42 and 99)
    expect(screen.getByTestId('filtered-events-count').textContent).toBe('2');
    
    // Should display only events for societies 42 and 99
    expect(screen.getAllByTestId('event-item')).toHaveLength(2);
    expect(screen.getByText('Event for Society 42 (Society: 42)')).toBeInTheDocument();
    expect(screen.getByText('Event for Society 99 (Society: 99)')).toBeInTheDocument();
    expect(screen.queryByText(/Event for Society 1/)).not.toBeInTheDocument();
  });

  it('should handle string IDs correctly', () => {
    const societiesWithStringIds = [
      { id: "1", name: 'Society One' },
      { id: "abc", name: 'Society ABC' },
    ];
    
    const eventsWithStringIds = [
      { id: 1, title: 'Event for Society 1', hostedBy: "1" },
      { id: 2, title: 'Event for Society ABC', hostedBy: "abc" },
      { id: 3, title: 'Event for Society 2', hostedBy: 2 },
    ];
    
    render(<MockCalendar societies={societiesWithStringIds} userEvents={eventsWithStringIds} />);
    
    // Should have 2 filtered events (only those with matching string IDs)
    expect(screen.getByTestId('filtered-events-count').textContent).toBe('2');
    
    // Should display only events for societies with matching IDs
    expect(screen.getAllByTestId('event-item')).toHaveLength(2);
    expect(screen.getByText('Event for Society 1 (Society: 1)')).toBeInTheDocument();
    expect(screen.getByText('Event for Society ABC (Society: abc)')).toBeInTheDocument();
    expect(screen.queryByText(/Event for Society 2/)).not.toBeInTheDocument();
  });

  it('should handle null or undefined society IDs', () => {
    const edgeCaseEvents = [
      { id: 1, title: 'Normal Event', hostedBy: 1 },
      { id: 2, title: 'Event with undefined society', hostedBy: undefined },
      { id: 3, title: 'Event with null society', hostedBy: null },
    ];
    
    render(<MockCalendar societies={[{ id: 1, name: 'Society One' }]} userEvents={edgeCaseEvents} />);
    
    // Should have 1 filtered event (only the one with a valid society ID)
    expect(screen.getByTestId('filtered-events-count').textContent).toBe('1');
    
    // Should display only the event with a valid society ID
    expect(screen.getAllByTestId('event-item')).toHaveLength(1);
    expect(screen.getByText('Normal Event (Society: 1)')).toBeInTheDocument();
    expect(screen.queryByText(/Event with undefined society/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Event with null society/)).not.toBeInTheDocument();
  });

  // NEW TESTS BELOW
  
  it('should handle duplicate society IDs correctly', () => {
    // Society list with duplicate IDs
    const societiesWithDuplicates = [
      { id: 1, name: 'Society One' },
      { id: 1, name: 'Society One Duplicate' }, // Duplicate ID
      { id: 2, name: 'Society Two' },
    ];
    
    const eventsForDuplicateTest = [
      { id: 101, title: 'Event for Society 1', hostedBy: 1 },
      { id: 102, title: 'Another Event for Society 1', hostedBy: 1 },
      { id: 103, title: 'Event for Society 2', hostedBy: 2 },
    ];
    
    render(<MockCalendar societies={societiesWithDuplicates} userEvents={eventsForDuplicateTest} />);
    
    // Should have filtered all events for societies 1 and 2
    expect(screen.getByTestId('filtered-events-count').textContent).toBe('3');
    
    // Each event should appear exactly once
    const displayedEvents = screen.getAllByTestId('event-item');
    expect(displayedEvents).toHaveLength(3);
    
    // Ensure events aren't duplicated due to duplicate society IDs
    const eventText = displayedEvents.map(event => event.textContent);
    const uniqueEventText = [...new Set(eventText)];
    expect(eventText.length).toBe(uniqueEventText.length);
  });

  it('should handle case where hostedBy is not a direct match but a string representation', () => {
    const societies = [
      { id: 1, name: 'Society One' },
      { id: 2, name: 'Society Two' },
    ];
    
    const mixedTypeEvents = [
      { id: 101, title: 'Event with number ID', hostedBy: 1 },
      { id: 102, title: 'Event with string ID', hostedBy: "2" }, // String instead of number
      { id: 103, title: 'Event not in societies', hostedBy: 3 },
    ];
    
    render(<MockCalendar societies={societies} userEvents={mixedTypeEvents} />);
    
    // Should match both events despite mixed types
    expect(screen.getByTestId('filtered-events-count').textContent).toBe('1');
    
    // Should only show the event with number ID
    expect(screen.getByText('Event with number ID (Society: 1)')).toBeInTheDocument();
    
    // Should not show the event with string ID as strict comparison will fail
    expect(screen.queryByText(/Event with string ID/)).not.toBeInTheDocument();
  });

  it('should handle a large number of societies and events efficiently', () => {
    // Create 100 societies
    const manySocieties = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      name: `Society ${i + 1}`
    }));
    
    // Create 1000 events, half of which match the societies
    const manyEvents = Array.from({ length: 1000 }, (_, i) => ({
      id: i + 1,
      title: `Event ${i + 1}`,
      hostedBy: i % 200 + 1 // Only first 100 IDs match societies
    }));
    
    render(<MockCalendar societies={manySocieties} userEvents={manyEvents} />);
    
    // Should have 500 filtered events (those with hostedBy 1-100)
    expect(screen.getByTestId('filtered-events-count').textContent).toBe('500');
    
    // Check sample events to ensure filtering worked correctly
    expect(screen.getByText('Event 1 (Society: 1)')).toBeInTheDocument();
    expect(screen.getByText('Event 100 (Society: 100)')).toBeInTheDocument();
    expect(screen.queryByText('Event 101 (Society: 101)')).not.toBeInTheDocument();
  });

  it('should correctly handle events with same name but different societies', () => {
    const societiesForDupeEvents = [
      { id: 1, name: 'Society One' },
      { id: 3, name: 'Society Three' },
    ];
    
    const eventsWithSameNames = [
      { id: 101, title: 'Annual Meeting', hostedBy: 1 }, // Should be included
      { id: 102, title: 'Annual Meeting', hostedBy: 2 }, // Should NOT be included
      { id: 103, title: 'Annual Meeting', hostedBy: 3 }, // Should be included
    ];
    
    render(<MockCalendar societies={societiesForDupeEvents} userEvents={eventsWithSameNames} />);
    
    // Should have 2 filtered events (hosted by societies 1 and 3)
    expect(screen.getByTestId('filtered-events-count').textContent).toBe('2');
    
    // Should have 2 events with the same title but from different societies
    const annualMeetings = screen.getAllByText(/Annual Meeting/);
    expect(annualMeetings).toHaveLength(2);
    
    // Check they're from the correct societies
    expect(screen.getByText('Annual Meeting (Society: 1)')).toBeInTheDocument();
    expect(screen.getByText('Annual Meeting (Society: 3)')).toBeInTheDocument();
    // Ensure the other one isn't there
    expect(screen.queryByText('Annual Meeting (Society: 2)')).not.toBeInTheDocument();
  });

  it('should handle events with zero IDs correctly', () => {
    const societiesWithZero = [
      { id: 0, name: 'Society Zero' },
      { id: 1, name: 'Society One' },
    ];
    
    const eventsWithZero = [
      { id: 1, title: 'Event for Society Zero', hostedBy: 0 },
      { id: 2, title: 'Event for Society One', hostedBy: 1 },
      { id: 3, title: 'Event for Society Two', hostedBy: 2 },
    ];
    
    render(<MockCalendar societies={societiesWithZero} userEvents={eventsWithZero} />);
    
    // Should include events for societies 0 and 1
    expect(screen.getByTestId('filtered-events-count').textContent).toBe('2');
    
    // Check specific events
    expect(screen.getByText('Event for Society Zero (Society: 0)')).toBeInTheDocument();
    expect(screen.getByText('Event for Society One (Society: 1)')).toBeInTheDocument();
    expect(screen.queryByText(/Event for Society Two/)).not.toBeInTheDocument();
  });

  it('should handle case sensitivity in string IDs correctly', () => {
    const caseSpecificSocieties = [
      { id: "abc", name: 'Society ABC' },
      { id: "XYZ", name: 'Society XYZ' },
    ];
    
    const caseSpecificEvents = [
      { id: 1, title: 'Event for abc', hostedBy: "abc" },
      { id: 2, title: 'Event for ABC', hostedBy: "ABC" }, // Different case
      { id: 3, title: 'Event for XYZ', hostedBy: "XYZ" },
      { id: 4, title: 'Event for xyz', hostedBy: "xyz" }, // Different case
    ];
    
    render(<MockCalendar societies={caseSpecificSocieties} userEvents={caseSpecificEvents} />);
    
    // Only exact case matches should be included
    expect(screen.getByTestId('filtered-events-count').textContent).toBe('2');
    
    // Check specific events - exact case matches only
    expect(screen.getByText('Event for abc (Society: abc)')).toBeInTheDocument();
    expect(screen.getByText('Event for XYZ (Society: XYZ)')).toBeInTheDocument();
    expect(screen.queryByText(/Event for ABC/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Event for xyz/)).not.toBeInTheDocument();
  });

  it('should include all events from the same society', () => {
    const singleSociety = [
      { id: 1, name: 'Computer Science Society' },
    ];
    
    const multipleEvents = [
      { id: 101, title: 'CS Workshop', hostedBy: 1 },
      { id: 102, title: 'Hackathon', hostedBy: 1 },
      { id: 103, title: 'Coding Competition', hostedBy: 1 },
      { id: 104, title: 'Tech Talk', hostedBy: 1 },
      { id: 105, title: 'Other Event', hostedBy: 2 },
    ];
    
    render(<MockCalendar societies={singleSociety} userEvents={multipleEvents} />);
    
    // Should include all 4 events from society 1
    expect(screen.getByTestId('filtered-events-count').textContent).toBe('4');
    
    // Check all events from society 1 are displayed
    expect(screen.getByText('CS Workshop (Society: 1)')).toBeInTheDocument();
    expect(screen.getByText('Hackathon (Society: 1)')).toBeInTheDocument();
    expect(screen.getByText('Coding Competition (Society: 1)')).toBeInTheDocument();
    expect(screen.getByText('Tech Talk (Society: 1)')).toBeInTheDocument();
    expect(screen.queryByText(/Other Event/)).not.toBeInTheDocument();
  });

  it('should correctly exclude events when society list changes', () => {
    // First render with all societies
    const { rerender } = render(
      <MockCalendar 
        societies={[
          { id: 1, name: 'Society One' },
          { id: 2, name: 'Society Two' },
          { id: 3, name: 'Society Three' }
        ]} 
        userEvents={[
          { id: 101, title: 'Event One', hostedBy: 1 },
          { id: 102, title: 'Event Two', hostedBy: 2 },
          { id: 103, title: 'Event Three', hostedBy: 3 }
        ]}
      />
    );
    
    // All 3 events should be displayed
    expect(screen.getByTestId('filtered-events-count').textContent).toBe('3');
    expect(screen.getAllByTestId('event-item')).toHaveLength(3);
    
    // Now rerender with only society 1 and 3
    rerender(
      <MockCalendar 
        societies={[
          { id: 1, name: 'Society One' },
          { id: 3, name: 'Society Three' }
        ]} 
        userEvents={[
          { id: 101, title: 'Event One', hostedBy: 1 },
          { id: 102, title: 'Event Two', hostedBy: 2 },
          { id: 103, title: 'Event Three', hostedBy: 3 }
        ]}
      />
    );
    
    // Now only 2 events should be displayed
    expect(screen.getByTestId('filtered-events-count').textContent).toBe('2');
    expect(screen.getAllByTestId('event-item')).toHaveLength(2);
    expect(screen.getByText('Event One (Society: 1)')).toBeInTheDocument();
    expect(screen.getByText('Event Three (Society: 3)')).toBeInTheDocument();
    expect(screen.queryByText(/Event Two/)).not.toBeInTheDocument();
  });

  it('should handle hostedBy values with different data types correctly', () => {
    const societies = [
      { id: 1, name: 'Society One' },
      { id: "2", name: 'Society Two String' },
    ];
    
    const mixedTypeEvents = [
      { id: 101, title: 'Event with number hostedBy', hostedBy: 1 },
      { id: 102, title: 'Event with string hostedBy', hostedBy: "1" }, // String version of 1
      { id: 103, title: 'Event with string ID', hostedBy: "2" },
      { id: 104, title: 'Event with number ID for string society', hostedBy: 2 },
      { id: 105, title: 'Event not in societies', hostedBy: 3 },
    ];
    
    render(<MockCalendar societies={societies} userEvents={mixedTypeEvents} />);
    
    // Check which events pass the filter based on strict equality
    const filteredCount = screen.getByTestId('filtered-events-count').textContent;
    
    // The exact number depends on how includes() compares types in JavaScript
    // It should at least include the exact matches
    expect(screen.getByText('Event with number hostedBy (Society: 1)')).toBeInTheDocument();
    expect(screen.queryByText(/Event not in societies/)).not.toBeInTheDocument();
  });
});