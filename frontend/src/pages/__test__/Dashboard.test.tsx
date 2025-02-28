import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import Dashboard from '../Dashboard';
import { getAllEvents } from '../../api';
import '@testing-library/jest-dom';

// Mock dependencies
vi.mock('../../api');
vi.mock('../../components/EventCalendar', () => ({
  default: () => <div data-testid="event-calendar">Event Calendar Component</div>
}));
vi.mock('../../components/UpcomingEvents', () => ({
  default: ({ events }) => (
    <div data-testid="upcoming-events">
      Upcoming Events: {events.length}
    </div>
  )
}));
vi.mock('../../components/PopularSocieties', () => ({
  default: () => <div data-testid="popular-societies">Popular Societies Component</div>
}));
vi.mock('../../components/Sidebar', () => ({
  default: ({ onClose, onToggle, navigationItems, darkMode, onToggleDarkMode, sidebarWidth }) => (
    <div data-testid="sidebar" data-darkmode={darkMode} data-sidebarwidth={sidebarWidth}>
      <button data-testid="sidebar-toggle" onClick={onToggle}>Toggle</button>
      <button data-testid="sidebar-close" onClick={onClose}>Close</button>
      <button data-testid="toggle-dark-mode" onClick={onToggleDarkMode}>Toggle Dark Mode</button>
      <ul>
        {navigationItems.map((item, index) => (
          <li key={index} data-testid={`nav-item-${index}`}>
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  )
}));
vi.mock('../../components/loading/loading-view', () => ({
  LoadingView: () => <div data-testid="loading-view">Loading...</div>
}));

// Mock framer-motion to avoid animation related issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    section: ({ children, ...props }) => <section {...props}>{children}</section>,
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    header: ({ children, ...props }) => <header {...props}>{children}</header>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
  }
}));

// Create a minimal WebSocket mock
let mockWebSocketInstance = {
  onopen: null,
  onmessage: null,
  onerror: null,
  onclose: null,
};

class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  
  readyState = MockWebSocket.CONNECTING;
  
  constructor() {
    mockWebSocketInstance = this;
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) this.onopen();
    }, 0);
  }
  
  close() {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) this.onclose({ code: 1000 });
  }
  
  send() {}
}

// Replace the real WebSocket with our mock
global.WebSocket = MockWebSocket;

// Mock event data
const mockEvents = [
  {
    id: 1,
    title: "Test Event 1",
    date: "2025-03-15",
    startTime: "09:00:00",
    duration: "01:30:00"
  },
  {
    id: 2,
    title: "Test Event 2",
    date: "2025-03-20",
    startTime: "14:00:00",
    duration: "02:00:00"
  }
];

// Mock localStorage
const mockLocalStorage = {
  store: {},
  getItem: vi.fn((key) => mockLocalStorage.store[key] || null),
  setItem: vi.fn((key, value) => {
    mockLocalStorage.store[key] = value;
  }),
  clear: vi.fn(() => {
    mockLocalStorage.store = {};
  })
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock matchMedia
window.matchMedia = vi.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

// Mock scrollTo
window.scrollTo = vi.fn();

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
    document.documentElement.classList.remove('dark');
    vi.mocked(getAllEvents).mockResolvedValue(mockEvents);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  test('renders loading state initially', () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
    expect(screen.getByTestId('loading-view')).toBeInTheDocument();
  });

  test('fetches and displays events after loading', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
    
    await waitFor(() => expect(screen.queryByTestId('loading-view')).not.toBeInTheDocument());
    
    expect(getAllEvents).toHaveBeenCalled();
    expect(screen.getByTestId('event-calendar')).toBeInTheDocument();
    expect(screen.getByTestId('upcoming-events')).toBeInTheDocument();
  });

  test('toggle sidebar width correctly', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
    
    await waitFor(() => expect(screen.queryByTestId('loading-view')).not.toBeInTheDocument());
    
    // Check initial sidebar state
    expect(screen.getByTestId('sidebar')).toHaveAttribute('data-sidebarwidth', 'collapsed');
    
    // Toggle sidebar width
    fireEvent.click(screen.getByTestId('sidebar-toggle'));
    
    // Check that sidebar width has changed
    expect(screen.getByTestId('sidebar')).toHaveAttribute('data-sidebarwidth', 'expanded');
    
    // Close sidebar
    fireEvent.click(screen.getByTestId('sidebar-close'));
    
    // Check that sidebar width is collapsed
    expect(screen.getByTestId('sidebar')).toHaveAttribute('data-sidebarwidth', 'collapsed');
  });

  test('navigation links are correctly rendered', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
    
    await waitFor(() => expect(screen.queryByTestId('loading-view')).not.toBeInTheDocument());
    
    // Check navigation items
    expect(screen.getByTestId('nav-item-0')).toHaveTextContent('Dashboard');
    expect(screen.getByTestId('nav-item-1')).toHaveTextContent('Statistics');
    expect(screen.getByTestId('nav-item-2')).toHaveTextContent('Popular Societies');
    expect(screen.getByTestId('nav-item-3')).toHaveTextContent('Upcoming Events');
    expect(screen.getByTestId('nav-item-4')).toHaveTextContent('Event Calendar');
    expect(screen.getByTestId('nav-item-5')).toHaveTextContent('Updates');
  });

  test('search input updates value on change', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
    
    await waitFor(() => expect(screen.queryByTestId('loading-view')).not.toBeInTheDocument());
    
    const searchInput = screen.getByPlaceholderText('Search...');
    fireEvent.change(searchInput, { target: { value: 'test search' } });
    
    expect(searchInput).toHaveValue('test search');
  });

  test('toggles dark mode correctly', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
    
    await waitFor(() => expect(screen.queryByTestId('loading-view')).not.toBeInTheDocument());
    
    // Check initial dark mode state
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    
    // Toggle dark mode
    fireEvent.click(screen.getByTestId('toggle-dark-mode'));
    
    // Check that dark mode class was added
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('darkMode', 'true');
    
    // Toggle dark mode again
    fireEvent.click(screen.getByTestId('toggle-dark-mode'));
    
    // Check that dark mode class was removed
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('darkMode', 'false');
  });

  test('displays empty state messages when no events', async () => {
    // Mock API to return empty events
    vi.mocked(getAllEvents).mockResolvedValue([]);
    
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
    
    await waitFor(() => expect(screen.queryByTestId('loading-view')).not.toBeInTheDocument());
    
    // Check empty states
    expect(screen.getByText('No upcoming events.')).toBeInTheDocument();
    expect(screen.getByText('No events scheduled yet.')).toBeInTheDocument();
  });

  test('handles invalid event data gracefully', async () => {
    // Mock API to return invalid event data
    vi.mocked(getAllEvents).mockResolvedValue([
      {
        id: 1,
        title: "Invalid Event",
        date: "invalid-date", // Invalid date
        startTime: "09:00:00",
        duration: "01:30:00"
      }
    ]);
    
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
    
    await waitFor(() => expect(screen.queryByTestId('loading-view')).not.toBeInTheDocument());
    
    // Check for empty state text instead of looking for "Upcoming Events: 0"
    expect(screen.getByText('No upcoming events.')).toBeInTheDocument();
  });

  test('initial dark mode from localStorage', async () => {
    // Set dark mode to true in localStorage
    mockLocalStorage.store.darkMode = 'true';
    
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
    
    await waitFor(() => expect(screen.queryByTestId('loading-view')).not.toBeInTheDocument());
    
    // Dark mode should be active
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(screen.getByTestId('sidebar')).toHaveAttribute('data-darkmode', 'true');
  });
});