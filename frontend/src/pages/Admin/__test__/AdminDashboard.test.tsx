import React from 'react';
import { render, screen, waitFor, act, within } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AdminDashboard from '../AdminDashboard';
import { apiClient } from '../../../api';
import * as settingsStoreModule from '../../../stores/settings-store';
import * as authStoreModule from '../../../stores/auth-store';

// Mock the dependencies
vi.mock('../../../api', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

// Mock React Router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

// Mock Zustand stores
vi.mock('../../../stores/settings-store', () => {
  const actual = vi.importActual('../../../stores/settings-store');
  return {
    ...actual,
    useSettingsStore: vi.fn(),
  };
});

vi.mock('../../../stores/auth-store', () => {
  const actual = vi.importActual('../../../stores/auth-store');
  return {
    ...actual,
    useAuthStore: vi.fn(),
  };
});

vi.mock('../../../components/Header', () => ({
  default: ({ title, subtitle }) => (
    <div data-testid="header">
      <div data-testid="header-title">{title}</div>
      <div data-testid="header-subtitle">{subtitle}</div>
    </div>
  ),
}));

vi.mock('react-icons/fa', () => ({
  FaUsers: () => <div data-testid="users-icon" />,
  FaCalendarAlt: () => <div data-testid="calendar-icon" />,
  FaEnvelope: () => <div data-testid="envelope-icon" />,
  FaNewspaper: () => <div data-testid="newspaper-icon" />,
}));

describe('AdminDashboard Component', () => {
  const mockUser = {
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
  };

  const mockUserStats = {
    totalUsers: 120,
    activeUsers: 95,
    inactiveUsers: 25,
  };

  const mockEvents = [
    { id: 1, title: 'Annual Meeting', date: '2025-04-15' },
    { id: 2, title: 'Workshop', date: '2025-04-20' },
  ];

  const mockNotifications = [
    { id: 1, body: 'New user registered', is_read: false },
    { id: 2, body: 'Event request pending approval', is_read: true },
  ];

  const mockPendingPublications = [
    { 
      id: 1, 
      news_post_title: 'Test Publication', 
      society_name: 'Test Society',
      requester_name: 'Test User',
      status: 'Pending'
    }
  ];

  const mockSetUser = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Set up the mock implementations for the Zustand hooks
    settingsStoreModule.useSettingsStore.mockImplementation(() => ({
      drawer: false
    }));
    
    authStoreModule.useAuthStore.mockImplementation(() => ({ 
      user: mockUser, 
      setUser: mockSetUser 
    }));

    // Mock the API calls - make sure these match the endpoint paths in AdminDashboard.tsx
    apiClient.get.mockImplementation((url) => {
      switch (url) {
        case '/api/dashboard/stats/':
          return Promise.resolve({ data: mockUserStats });
        case '/api/events/all/':
          return Promise.resolve({ data: mockEvents });
        case '/api/notifications/':
          return Promise.resolve({ data: mockNotifications });
        case '/api/society/joined/':
          return Promise.resolve({ data: [] });
        case '/api/news/publication-request/':
          return Promise.resolve({ data: mockPendingPublications });
        case '/api/user/current/':
          return Promise.resolve({ data: mockUser });
        default:
          return Promise.reject(new Error(`URL not mocked: ${url}`));
      }
    });
  });

  const renderComponent = async () => {
    return act(async () => {
      render(
        <MemoryRouter>
          <AdminDashboard />
        </MemoryRouter>
      );
    });
  };

  it('renders dashboard content', async () => {
    await renderComponent();
    
    // Verify the header renders
    expect(screen.getByTestId('header-title')).toBeInTheDocument();
  });

  it('renders the dashboard with correct content', async () => {
    await renderComponent();

    // Wait for the loading state to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading your dashboard...')).not.toBeInTheDocument();
    });

    // Check if the header is rendered with the correct user name
    expect(screen.getByTestId('header-title')).toHaveTextContent('Welcome to your Dashboard, John!');
    
    // Check if the main sections are rendered
    expect(screen.getByText('Active Users')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    
    // Check for section titles instead of specific values
    expect(screen.getByText('Active Events')).toBeInTheDocument();
    expect(screen.getByText('Pending Requests')).toBeInTheDocument();
    expect(screen.getByText('News Approvals')).toBeInTheDocument();
    
    // Check if notifications are rendered
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('New user registered')).toBeInTheDocument();
    expect(screen.getByText('Event request pending approval')).toBeInTheDocument();
    
    // Check publication requests section
    expect(screen.getByText('News Publication Requests')).toBeInTheDocument();
    expect(screen.getByText('Test Publication')).toBeInTheDocument();
    
    // Use regex to find text that contains "Test Society", even if it's part of a larger string
    expect(screen.getByText(/Test Society/)).toBeInTheDocument();
    expect(screen.getByText(/Test User/)).toBeInTheDocument();
    expect(screen.getByText('Review')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    // Mock API errors
    apiClient.get.mockRejectedValue(new Error('Failed to fetch data'));
    
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    await renderComponent();

    // Wait for the loading state to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading your dashboard...')).not.toBeInTheDocument();
    });

    // Check if error is logged
    expect(consoleErrorSpy).toHaveBeenCalled();
    
    // Check if the page still renders without crashing
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('No new notifications.')).toBeInTheDocument();
    
    consoleErrorSpy.mockRestore();
  });

  it('renders with drawer open', async () => {
    // Mock drawer being open
    settingsStoreModule.useSettingsStore.mockImplementation(() => ({
      drawer: true
    }));
    
    await renderComponent();

    await waitFor(() => {
      expect(screen.queryByText('Loading your dashboard...')).not.toBeInTheDocument();
    });

    // Verify component renders correctly with drawer open
    expect(screen.getByTestId('header-title')).toBeInTheDocument();
  });

  it('renders without user information', async () => {
    // Mock no user data
    authStoreModule.useAuthStore.mockImplementation(() => ({ 
      user: null, 
      setUser: mockSetUser 
    }));
    
    await renderComponent();

    await waitFor(() => {
      expect(screen.queryByText('Loading your dashboard...')).not.toBeInTheDocument();
    });

    // Check if the header uses default text when no user is present
    expect(screen.getByTestId('header-title')).toHaveTextContent('Welcome to your Dashboard, User!');
  });
});