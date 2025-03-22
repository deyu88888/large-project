import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import PresidentDrawer from '../../components/layout/PresidentDrawer';
import { apiClient } from '../../api';

// Mock the react-router-dom hooks
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
      writable: true
    });
    
    // Mock successful API response
    (apiClient.get).mockResolvedValue({
      data: mockStudentData
    });
  });

  const setup = async (drawerOpen = true) => {
    let renderResult;
    
    await act(async () => {
      renderResult = render(
        <MemoryRouter>
          <PresidentDrawer 
            drawer={drawerOpen} 
            toggleDrawer={mockToggleDrawer} 
            location={mockLocation} 
          />
        </MemoryRouter>
      );
      
      // Wait for useEffect to complete
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    return renderResult;
  };

  it('renders without crashing', async () => {
    await setup();
    expect(screen.getByText('President Dashboard')).toBeInTheDocument();
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
      expect(screen.getByText('President Dashboard')).toBeInTheDocument();
    });
    
    const userIcon = screen.getByAltText('testuser icon');
    expect(userIcon).toBeInTheDocument();
    expect(userIcon).toHaveStyle({
      width: '72px',
      height: '72px',
    });
  });

  it('displays compact user information when drawer is closed', async () => {
    await setup(false);
    
    const userIcon = screen.getByAltText('testuser icon');
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
    expect(screen.getByText('Start Society')).toBeInTheDocument();
    expect(screen.getByText('View Events')).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Inbox')).toBeInTheDocument();
  });

  it('renders society management menu items', async () => {
    await setup();
    
    expect(screen.getByText('Manage My Societies')).toBeInTheDocument();
    expect(screen.getByText('Society Details')).toBeInTheDocument();
    expect(screen.getByText('Society Events')).toBeInTheDocument();
    expect(screen.getByText('Pending Members')).toBeInTheDocument();
    expect(screen.getByText('All Members')).toBeInTheDocument();
    expect(screen.getByText('Report to Admin')).toBeInTheDocument();
  });

  it('renders the join societies section', async () => {
    await setup();
    
    // We need to use getAllByText because "Join Societies" appears twice in the document
    // Once in the section header and once in the menu item
    expect(screen.getAllByText('Join Societies')[0]).toBeInTheDocument();
  });

  it('renders the logout button', async () => {
    await setup();
    
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('calls toggleDrawer when chevron button is clicked', async () => {
    await setup();
    
    // There are multiple buttons, so we need to get the one with the ChevronLeftIcon
    const chevronButton = screen.getByTestId('ChevronLeftIcon').closest('button');
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
    
    (apiClient.get).mockRejectedValueOnce(new Error('Failed to fetch student data'));
    
    await setup();
    
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(alertMock).toHaveBeenCalledWith('Failed to retrieve student. Please contact an administrator.');
    
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
    
    const startSocietyLink = screen.getByText('Start Society').closest('a');
    expect(startSocietyLink).toHaveAttribute('href', '/student/start-society');
    
    const viewEventsLink = screen.getByText('View Events').closest('a');
    expect(viewEventsLink).toHaveAttribute('href', '/student/view-events');
  });

  it('navigates to correct routes for society management items', async () => {
    await setup();
    
    const manageSocietiesLink = screen.getByText('Manage My Societies').closest('a');
    expect(manageSocietiesLink).toHaveAttribute('href', '/president-page/1');
    
    const societyDetailsLink = screen.getByText('Society Details').closest('a');
    expect(societyDetailsLink).toHaveAttribute('href', '/president-page/1/manage-society-details');
    
    const societyEventsLink = screen.getByText('Society Events').closest('a');
    expect(societyEventsLink).toHaveAttribute('href', '/president-page/1/manage-society-events');
  });

  it('navigates to the join society page', async () => {
    await setup();
    
    // We need to use getAllByText because "Join Societies" appears twice
    // Then we need to find the one that's inside an <a> element
    const joinSocietiesElements = screen.getAllByText('Join Societies');
    const joinSocietiesLink = joinSocietiesElements.find(element => 
      element.closest('a') !== null
    ).closest('a');
    
    expect(joinSocietiesLink).toHaveAttribute('href', '/student/join-society');
  });
});