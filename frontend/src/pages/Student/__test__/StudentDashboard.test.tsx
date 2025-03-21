import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StudentDashboard from '../StudentDashboard';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/auth-store';
import { getAllEvents, apiClient } from '../../../api';

// Mock the dependencies
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn()
}));

vi.mock('../../../stores/auth-store', () => ({
  useAuthStore: () => ({ user: { id: 1 } })
}));

vi.mock('../../../api', () => ({
  getAllEvents: vi.fn(),
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  }
}));

vi.mock('../../../theme/theme', () => ({
  tokens: () => ({
    primary: {
      400: '#1F2A40',
      500: '#141B2D',
    },
    greenAccent: {
      500: '#4CAF50',
      700: '#2E7D32',
    },
    blueAccent: {
      400: '#42A5F5',
      500: '#2196F3',
      700: '#1565C0',
    },
    redAccent: {
      500: '#F44336',
    },
    grey: {
      100: '#FFFFFF',
      300: '#B0B0B0',
      700: '#616161',
      800: '#424242',
    }
  })
}));

vi.mock('../StudentCalendar', () => ({
  default: vi.fn(() => <div data-testid="student-calendar">Calendar Mock</div>)
}));

describe('StudentDashboard', () => {
  const mockNavigate = vi.fn();
  const mockSocieties = [
    { id: 1, name: 'Computer Society', is_president: false }
  ];
  const mockEvents = [
    {
      id: 1,
      title: 'Coding Workshop',
      description: 'Learn to code',
      date: '2025-03-25',
      start_time: '14:00',
      duration: '2 hours',
      location: 'Lab 101',
      hosted_by: 1,
      societyName: 'Computer Society',
      rsvp: false,
      status: 'Approved'
    }
  ];
  const mockNotifications = [
    {
      id: 1,
      header: 'New Event',
      body: 'There is a new event',
      is_read: false
    }
  ];

  // Setup before each test
  beforeEach(() => {
    vi.clearAllMocks();
    
    useNavigate.mockReturnValue(mockNavigate);
    
    // Mock the API responses
    apiClient.get.mockImplementation((url) => {
      if (url === 'api/user/current') {
        return Promise.resolve({ data: { id: 1 } });
      }
      if (url === '/api/student-societies') {
        return Promise.resolve({ data: mockSocieties });
      }
      if (url === '/api/notifications/') {
        return Promise.resolve({ data: mockNotifications });
      }
      if (url.includes('/api/award-students/')) {
        return Promise.resolve({ data: {} });
      }
      return Promise.resolve({ data: [] });
    });
    
    getAllEvents.mockResolvedValue(mockEvents);
  });

  it('renders loading state initially', async () => {
    render(<StudentDashboard />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders dashboard content after loading', async () => {
    render(<StudentDashboard />);
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('My Societies')).toBeInTheDocument();
    expect(screen.getByText('Society Events')).toBeInTheDocument();
    expect(screen.getByText('Unread Notifications')).toBeInTheDocument();
  });

  it('changes tabs when tab is clicked', async () => {
    render(<StudentDashboard />);
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Get all tabs
    const societiesTab = screen.getByRole('tab', { name: /societies/i });
    const eventsTab = screen.getByRole('tab', { name: /events/i });
    const notificationsTab = screen.getByRole('tab', { name: /notifications/i });
    
    // Click on Events tab
    fireEvent.click(eventsTab);
    expect(eventsTab).toHaveAttribute('aria-selected', 'true');
    expect(societiesTab).toHaveAttribute('aria-selected', 'false');
    
    // Verify Events content is shown
    expect(screen.getByText('Coding Workshop')).toBeInTheDocument();
    
    // Click on Notifications tab
    fireEvent.click(notificationsTab);
    expect(notificationsTab).toHaveAttribute('aria-selected', 'true');
    
    // Verify Notifications content is shown
    expect(screen.getByText('New Event')).toBeInTheDocument();
  });

  it('toggles calendar when show/hide calendar button is clicked', async () => {
    render(<StudentDashboard />);
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Initially calendar should be hidden
    expect(screen.getByText("Click \"Show Calendar\" to view your societies' events")).toBeInTheDocument();
    expect(screen.queryByTestId('student-calendar')).not.toBeInTheDocument();
    
    // Click Show Calendar button
    fireEvent.click(screen.getByRole('button', { name: /show calendar/i }));
    
    // Calendar should be visible
    expect(screen.queryByText("Click \"Show Calendar\" to view your societies' events")).not.toBeInTheDocument();
    expect(screen.getByTestId('student-calendar')).toBeInTheDocument();
    
    // Button text should change
    expect(screen.getByRole('button', { name: /hide calendar/i })).toBeInTheDocument();
    
    // Click Hide Calendar button
    fireEvent.click(screen.getByRole('button', { name: /hide calendar/i }));
    
    // Calendar should be hidden again
    expect(screen.getByText("Click \"Show Calendar\" to view your societies' events")).toBeInTheDocument();
    expect(screen.queryByTestId('student-calendar')).not.toBeInTheDocument();
  });

  it('handles RSVP button click', async () => {
    apiClient.post.mockResolvedValue({ status: 200 });
    
    render(<StudentDashboard />);
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Go to Events tab
    fireEvent.click(screen.getByRole('tab', { name: /events/i }));
    
    // Click RSVP button
    fireEvent.click(screen.getByRole('button', { name: /rsvp now/i }));
    
    // Verify API was called
    expect(apiClient.post).toHaveBeenCalledWith('/api/events/rsvp', { event_id: 1 });
  });

  it('navigates to create society page when button is clicked', async () => {
    render(<StudentDashboard />);
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Click Create New Society button
    fireEvent.click(screen.getByRole('button', { name: /create new society/i }));
    
    // Verify navigation
    expect(mockNavigate).toHaveBeenCalledWith('/student/start-society');
  });

  it('displays president button for society presidents', async () => {
    // Setup a new implementation for this specific test
    apiClient.get.mockImplementation((url) => {
      if (url === 'api/user/current') {
        return Promise.resolve({ 
          data: { 
            id: 1, 
            is_president: true,
            president_of: 1,
            president_of_society_name: 'Computer Society'
          } 
        });
      }
      if (url === '/api/student-societies') {
        return Promise.resolve({ data: mockSocieties });
      }
      if (url === '/api/notifications/') {
        return Promise.resolve({ data: mockNotifications });
      }
      if (url.includes('/api/award-students/')) {
        return Promise.resolve({ data: {} });
      }
      return Promise.resolve({ data: [] });
    });
    
    render(<StudentDashboard />);
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Verify Manage My Society button is shown
    expect(screen.getByRole('button', { name: /manage my society/i })).toBeInTheDocument();
    
    // Click button
    fireEvent.click(screen.getByRole('button', { name: /manage my society/i }));
    
    // Verify navigation
    expect(mockNavigate).toHaveBeenCalledWith('/president-page/1');
  });

  it('handles marking notification as read', async () => {
    apiClient.patch.mockResolvedValue({ status: 200 });
    
    render(<StudentDashboard />);
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Go to Notifications tab
    fireEvent.click(screen.getByRole('tab', { name: /notifications/i }));
    
    // Click Mark as Read button
    fireEvent.click(screen.getByRole('button', { name: /mark as read/i }));
    
    // Verify API was called
    expect(apiClient.patch).toHaveBeenCalledWith('/api/notifications/1', { is_read: true });
  });
});