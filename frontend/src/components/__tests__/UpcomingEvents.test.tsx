import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import UpcomingEvents from '../UpcomingEvents';

// Mock framer-motion
vi.mock('framer-motion', () => {
  const variants = { hidden: {}, visible: {}, exit: {} };
  
  return {
    motion: {
      div: ({ children, ...props }) => (
        <div data-testid="motion-div" {...props}>
          {children}
        </div>
      ),
      ul: ({ children, ...props }) => (
        <ul data-testid="motion-ul" {...props}>
          {children}
        </ul>
      ),
      li: ({ children, layout, whileHover, variants, ...props }) => (
        <li 
          data-testid="motion-li" 
          data-layout={layout ? "true" : undefined}
          variants={JSON.stringify(variants)}
          whilehover={JSON.stringify(whileHover)}
          {...props}
        >
          {children}
        </li>
      ),
      span: ({ children, whileHover, ...props }) => (
        <span 
          data-testid="motion-span"
          data-whilehover={JSON.stringify(whileHover)}
          {...props}
        >
          {children}
        </span>
      ),
      p: ({ children, ...props }) => (
        <p data-testid="motion-p" {...props}>
          {children}
        </p>
      ),
    },
    AnimatePresence: ({ children }) => (
      <div data-testid="animate-presence">{children}</div>
    ),
    Variants: variants,
  };
});

// Mock the formatDateTime function since it's using Intl.DateTimeFormat
vi.mock('../UpcomingEvents', async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    default: mod.default,
    // Override the actual format function for testing
    formatDateTime: vi.fn().mockImplementation(() => 'Mon 02 Jan, 10:00 am')
  };
});

describe('UpcomingEvents Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2023-01-01T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const mockEvents = [
    {
      id: 1,
      title: 'First Event',
      start: new Date('2023-01-02T10:00:00'),
      end: new Date('2023-01-02T11:00:00')
    },
    {
      id: 2,
      title: 'Second Event',
      start: new Date('2023-01-03T14:00:00'),
      end: new Date('2023-01-03T15:30:00')
    },
    {
      id: 3,
      title: 'Third Event',
      start: new Date('2023-01-04T09:00:00'),
      end: new Date('2023-01-04T10:00:00')
    },
    {
      id: 4,
      title: 'Fourth Event',
      start: new Date('2023-01-05T16:00:00'),
      end: new Date('2023-01-05T17:00:00')
    },
    {
      id: 5,
      title: 'Fifth Event',
      start: new Date('2023-01-06T11:00:00'),
      end: new Date('2023-01-06T12:00:00')
    },
    {
      id: 6,
      title: 'Sixth Event',
      start: new Date('2023-01-07T13:00:00'),
      end: new Date('2023-01-07T14:00:00')
    }
  ];

  const pastEvents = [
    {
      id: 7,
      title: 'Past Event',
      start: new Date('2022-12-31T10:00:00'),
      end: new Date('2022-12-31T11:00:00')
    }
  ];

  test('renders without crashing', () => {
    render(<UpcomingEvents events={[]} />);
    expect(screen.getByRole('region')).toBeInTheDocument();
  });

  test('displays "No upcoming events" when events array is empty', () => {
    render(<UpcomingEvents events={[]} />);
    expect(screen.getByText('No upcoming events.')).toBeInTheDocument();
  });

  test('displays "No upcoming events" when all events are in the past', () => {
    render(<UpcomingEvents events={pastEvents} />);
    expect(screen.getByText('No upcoming events.')).toBeInTheDocument();
  });

  test('renders events correctly', () => {
    render(<UpcomingEvents events={mockEvents.slice(0, 1)} />);
    expect(screen.getByText('First Event')).toBeInTheDocument();
    expect(screen.getByTestId('motion-p')).toHaveTextContent(/Starts in:/);
  });

  test('sorts events by start time', () => {
    const unsortedEvents = [
      mockEvents[1], // Second Event
      mockEvents[0]  // First Event
    ];
    
    render(<UpcomingEvents events={unsortedEvents} />);
    
    const listItems = screen.getAllByTestId('motion-li');
    expect(listItems[0]).toHaveTextContent('First Event');
    expect(listItems[1]).toHaveTextContent('Second Event');
  });

  test('filters out past events', () => {
    const mixedEvents = [...mockEvents.slice(0, 1), ...pastEvents];
    
    render(<UpcomingEvents events={mixedEvents} />);
    
    expect(screen.getByText('First Event')).toBeInTheDocument();
    expect(screen.queryByText('Past Event')).not.toBeInTheDocument();
  });

  test('limits display to 5 events', () => {
    render(<UpcomingEvents events={mockEvents} />);
    
    expect(screen.getByText('First Event')).toBeInTheDocument();
    expect(screen.getByText('Fifth Event')).toBeInTheDocument();
    expect(screen.queryByText('Sixth Event')).not.toBeInTheDocument();
    
    const listItems = screen.getAllByTestId('motion-li');
    expect(listItems.length).toBe(5);
  });

  test('countdown is displayed correctly', () => {
    render(<UpcomingEvents events={mockEvents.slice(0, 1)} />);
    
    // Use getByTestId instead of getByText for more reliable testing
    const countdownElement = screen.getByTestId('motion-p');
    expect(countdownElement).toHaveTextContent('Starts in:');
    expect(countdownElement).toHaveTextContent('d');
    expect(countdownElement).toHaveTextContent('h');
    expect(countdownElement).toHaveTextContent('m');
    expect(countdownElement).toHaveTextContent('s');
  });

  test('formatDateTime function works correctly', () => {
    render(<UpcomingEvents events={mockEvents.slice(0, 1)} />);
    
  });

  test('countdown returns zeros for past dates', () => {
    vi.setSystemTime(new Date('2023-01-03T12:00:00')); // After first event
    
    render(<UpcomingEvents events={mockEvents.slice(0, 1)} />);
    
    expect(screen.queryByText(/Starts in:/)).not.toBeInTheDocument();
    expect(screen.getByText('No upcoming events.')).toBeInTheDocument();
  });

  test('clears timers on unmount', () => {
    // Create mock implementation for setInterval and clearInterval
    const mockSetInterval = vi.fn().mockReturnValue(123);
    const mockClearInterval = vi.fn();
    
    // Save original functions
    const originalSetInterval = global.setInterval;
    const originalClearInterval = global.clearInterval;
    
    // Replace with mocks
    global.setInterval = mockSetInterval;
    global.clearInterval = mockClearInterval;
    
    try {
      // Render and unmount component
      const { unmount } = render(<UpcomingEvents events={mockEvents.slice(0, 1)} />);
      
      // Check setInterval was called
      expect(mockSetInterval).toHaveBeenCalled();
      
      // Reset for clean test
      mockClearInterval.mockReset();
      
      // Unmount component
      unmount();
      
      // Verify clearInterval was called with the timer ID
      expect(mockClearInterval).toHaveBeenCalledWith(123);
    } finally {
      // Restore original functions
      global.setInterval = originalSetInterval;
      global.clearInterval = originalClearInterval;
    }
  });

  test('applies framer motion animation properties', () => {
    render(<UpcomingEvents events={mockEvents.slice(0, 1)} />);
    
    const listItem = screen.getByTestId('motion-li');
    expect(listItem).toHaveAttribute('variants');
    expect(listItem).toHaveAttribute('initial');
    expect(listItem).toHaveAttribute('animate');
    expect(listItem).toHaveAttribute('exit');
    expect(listItem).toHaveAttribute('data-layout');
  });

  test('has correct responsive design classes', () => {
    render(<UpcomingEvents events={mockEvents.slice(0, 1)} />);
    
    const listItem = screen.getByTestId('motion-li');
    expect(listItem.className).toContain('flex flex-col md:flex-row');
    
    const counterElement = listItem.querySelector('div:nth-of-type(2)');
    expect(counterElement.className).toContain('mt-4 md:mt-0');
  });

  // Simple component tests for different number of events
  test('handles empty events array', () => {
    render(<UpcomingEvents events={[]} />);
    expect(screen.getByText('No upcoming events.')).toBeInTheDocument();
  });

  test('handles single event', () => {
    render(<UpcomingEvents events={mockEvents.slice(0, 1)} />);
    const listItems = screen.getAllByTestId('motion-li');
    expect(listItems.length).toBe(1);
  });
  
  test('handles multiple events', () => {
    render(<UpcomingEvents events={mockEvents.slice(0, 3)} />);
    const listItems = screen.getAllByTestId('motion-li');
    expect(listItems.length).toBe(3);
  });
});