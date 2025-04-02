import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import PresidentDrawer from '../../components/layout/PresidentDrawer';
import { apiClient } from '../../api';

// Create a mock for useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock the API client
vi.mock('../../api', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('PresidentDrawer Component', () => {
  const mockLocation = { pathname: '/student' };
  const mockToggleDrawer = vi.fn();
  const mockStudentData = {
    username: 'testuser',
    first_name: 'Test',
    last_name: 'User',
    icon: '/media/profile/testuser.jpg',
    president_of: '1',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        removeItem: vi.fn(),
        setItem: vi.fn(),
      },
      writable: true,
    });
    
    // Mock successful API response - important to resolve this immediately
    apiClient.get.mockResolvedValue({
      data: mockStudentData,
    });
  });

  const setup = async (drawerOpen = true) => {
    let component;
    await act(async () => {
      component = render(
        <MemoryRouter>
          <PresidentDrawer 
            drawer={drawerOpen} 
            toggleDrawer={mockToggleDrawer} 
            location={mockLocation} 
          />
        </MemoryRouter>
      );
    });
    
    // Important: Wait for the useEffect and API call to complete
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/user/current');
    });
    
    return component;
  };

  it('renders without crashing', async () => {
    await setup();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('fetches student data on mount', async () => {
    await setup();
    expect(apiClient.get).toHaveBeenCalledWith('/api/user/current');
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
  });

  it('displays user information when drawer is open', async () => {
    await setup(true);
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('President')).toBeInTheDocument();
    });
    const userIcon = screen.getByAltText(`${mockStudentData.username} icon`);
    expect(userIcon).toBeInTheDocument();
    expect(userIcon).toHaveStyle({
      width: '72px',
      height: '72px',
    });
  });

  it('displays compact user information when drawer is closed', async () => {
    await setup(false);
    const userIcon = screen.getByAltText(`${mockStudentData.username} icon`);
    expect(userIcon).toBeInTheDocument();
    expect(userIcon).toHaveStyle({
      width: '25px',
      height: '25px',
    });
    expect(screen.queryByText('Test User')).not.toBeInTheDocument();
  });

  it('renders all main menu items', async () => {
    await setup();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('My Societies')).toBeInTheDocument();
    expect(screen.getByText('My Events')).toBeInTheDocument();
    expect(screen.getByText('News')).toBeInTheDocument();
    expect(screen.getByText('Discover Societies')).toBeInTheDocument();
    expect(screen.getByText('Discover Events')).toBeInTheDocument();
  });

  it('renders management menu items', async () => {
    await setup();
    await waitFor(() => {
      expect(screen.getByText('Manage My Societies')).toBeInTheDocument();
    });
  });

  it('renders bottom menu items', async () => {
    await setup();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Inbox')).toBeInTheDocument();
    expect(screen.getByText('Report')).toBeInTheDocument();
  });

  it('renders the logout button', async () => {
    await setup();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('calls toggleDrawer when chevron button is clicked', async () => {
    await setup();
    const chevronButton = screen.getByRole('button', { name: '' });
    fireEvent.click(chevronButton);
    expect(mockToggleDrawer).toHaveBeenCalledTimes(1);
  });

  it('handles logout correctly', async () => {
    await setup();
    const logoutButton = screen.getByText('Logout').closest('div');
    fireEvent.click(logoutButton);
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('access');
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('refresh');
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('handles API error when fetching student data', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const alertMock = vi.fn();
    global.alert = alertMock;
    apiClient.get.mockRejectedValueOnce(new Error('Failed to fetch student data'));
    
    await act(async () => {
      render(
        <MemoryRouter>
          <PresidentDrawer 
            drawer={true} 
            toggleDrawer={mockToggleDrawer} 
            location={mockLocation} 
          />
        </MemoryRouter>
      );
    });
    
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(alertMock).toHaveBeenCalledWith('Failed to retrieve student. Please contact an administrator.');
    });
    
    consoleErrorSpy.mockRestore();
  });

  it('updates selected item when menu item is clicked', async () => {
    await setup();
    const dashboardLink = screen.getByText('Dashboard').closest('a');
    const mySocietiesLink = screen.getByText('My Societies').closest('a');
    
    // Initially Dashboard should be selected
    expect(dashboardLink).toHaveClass('Mui-selected');
    
    // Click on My Societies
    fireEvent.click(mySocietiesLink);
    
    // Now My Societies should be selected
    expect(mySocietiesLink).toHaveClass('Mui-selected');
    expect(dashboardLink).not.toHaveClass('Mui-selected');
  });

  it('navigates to correct routes for main menu items', async () => {
    await setup();
    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveAttribute('href', '/student');
    
    const mySocietiesLink = screen.getByText('My Societies').closest('a');
    expect(mySocietiesLink).toHaveAttribute('href', '/student/my-societies');
    
    const myEventsLink = screen.getByText('My Events').closest('a');
    expect(myEventsLink).toHaveAttribute('href', '/student/view-events');
  });

  it('navigates to the correct route for managing societies', async () => {
    await setup();
    await waitFor(() => {
      const manageSocietiesLink = screen.getByText('Manage My Societies').closest('a');
      expect(manageSocietiesLink).toHaveAttribute('href', '/president-page/1');
    });
  });

  it('navigates to the discover societies page', async () => {
    await setup();
    const discoverSocietiesLink = screen.getByText('Discover Societies').closest('a');
    expect(discoverSocietiesLink).toHaveAttribute('href', '/student/join-society');
  });
});