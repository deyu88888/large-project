import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StudentDashboard from '../StudentDashboard';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/auth-store';
import { getAllEvents, apiClient } from '../../../api';
import { act } from 'react';

vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn()
}));

vi.mock('../../../stores/auth-store', () => ({
  useAuthStore: vi.fn(() => ({ user: { id: 1 } }))
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
    purpleAccent: {
      500: '#9C27B0',
    },
    orangeAccent: {
      500: '#FF9800',
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

vi.mock('../SocietyNewsFeed', () => ({
  default: vi.fn(() => <div data-testid="society-news-feed">News Feed Mock</div>)
}));

vi.mock('../../../components/AwardCard', () => ({
  default: vi.fn(({ award }) => <div data-testid="award-card">{award.title || 'Award'}</div>)
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
      society_name: 'Computer Society',
      current_attendees: [],
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
  const mockAwards = [
    {
      id: 1,
      title: 'Outstanding Achievement',
      description: 'For outstanding contributions',
      date_awarded: '2025-03-01'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    useNavigate.mockReturnValue(mockNavigate);
    useAuthStore.mockReturnValue({ user: { id: 1 } });
    
    apiClient.get.mockImplementation((url) => {
      if (url === 'api/user/current') {
        return Promise.resolve({ data: { id: 1 } });
      }
      if (url === '/api/society/joined') {
        return Promise.resolve({ data: mockSocieties });
      }
      if (url === '/api/notifications/') {
        return Promise.resolve({ data: mockNotifications });
      }
      if (url === '/api/awards/students/') {
        return Promise.resolve({ data: mockAwards });
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
    
    const societiesTab = screen.getByRole('tab', { name: /societies/i });
    const eventsTab = screen.getByRole('tab', { name: /events/i });
    const notificationsTab = screen.getByRole('tab', { name: /notifications/i });
    
    expect(societiesTab).toHaveAttribute('aria-selected', 'true');
    
    await act(async () => {
      fireEvent.click(eventsTab);
    });
    
    expect(eventsTab).toHaveAttribute('aria-selected', 'true');
    expect(societiesTab).toHaveAttribute('aria-selected', 'false');
    
    await act(async () => {
      fireEvent.click(notificationsTab);
    });
    
    expect(notificationsTab).toHaveAttribute('aria-selected', 'true');
    
    expect(screen.getByText('New Event')).toBeInTheDocument();
  });

  it('toggles calendar when show/hide calendar button is clicked', async () => {
    render(<StudentDashboard />);
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    const showCalendarButton = screen.getByRole('button', { name: /show calendar/i });
    expect(showCalendarButton).toBeInTheDocument();
    expect(screen.queryByTestId('student-calendar')).not.toBeInTheDocument();
    
    await act(async () => {
      fireEvent.click(showCalendarButton);
    });
    
    expect(screen.getByTestId('student-calendar')).toBeInTheDocument();
    
    const hideCalendarButton = screen.getByRole('button', { name: /hide calendar/i });
    expect(hideCalendarButton).toBeInTheDocument();
    
    await act(async () => {
      fireEvent.click(hideCalendarButton);
    });
    
    expect(screen.queryByTestId('student-calendar')).not.toBeInTheDocument();
    
    expect(screen.getByRole('button', { name: /show calendar/i })).toBeInTheDocument();
  });

  it('handles RSVP button click', async () => {
    apiClient.get.mockImplementation((url) => {
      if (url === 'api/user/current') {
        return Promise.resolve({ data: { id: 1 } });
      }
      if (url === '/api/society/joined') {
        return Promise.resolve({ data: mockSocieties });
      }
      if (url === '/api/notifications/') {
        return Promise.resolve({ data: mockNotifications });
      }
      if (url === '/api/awards/students/') {
        return Promise.resolve({ data: mockAwards });
      }
      return Promise.resolve({ data: [] });
    });
    
    apiClient.post.mockResolvedValue({ status: 200 });
    
    render(<StudentDashboard />);
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: /events/i }));
    });
    
    expect(screen.getByRole('tab', { name: /events/i })).toHaveAttribute('aria-selected', 'true');
  });

  it('navigates to create society page when button is clicked', async () => {
    render(<StudentDashboard />);
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /create new society/i }));
    });
    
    expect(mockNavigate).toHaveBeenCalledWith('/student/start-society');
  });

  it('displays president button for society presidents', async () => {
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
      if (url === '/api/society/joined') {
        return Promise.resolve({ data: mockSocieties });
      }
      if (url === '/api/notifications/') {
        return Promise.resolve({ data: mockNotifications });
      }
      if (url === '/api/awards/students/') {
        return Promise.resolve({ data: mockAwards });
      }
      return Promise.resolve({ data: [] });
    });
    
    render(<StudentDashboard />);
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    expect(screen.getByRole('button', { name: /manage my society/i })).toBeInTheDocument();
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /manage my society/i }));
    });
    
    expect(mockNavigate).toHaveBeenCalledWith('/president-page/1');
  });

  it('handles marking notification as read', async () => {
    apiClient.patch.mockResolvedValue({ status: 200 });
    
    render(<StudentDashboard />);
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: /notifications/i }));
    });
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /mark as read/i }));
    });
    
    expect(apiClient.patch).toHaveBeenCalledWith('/api/notifications/1/', { is_read: true });
  });
});