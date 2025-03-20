import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AdminDrawer from '../../components/layout/AdminDrawer';

// Mock the react-router-dom hooks
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock the auth store
const mockUser = {
  first_name: 'Admin',
  last_name: 'User',
  is_super_admin: false
};

const mockSuperAdminUser = {
  first_name: 'Super',
  last_name: 'Admin',
  is_super_admin: true
};

vi.mock('../../stores/auth-store', () => ({
  useAuthStore: vi.fn()
}));

import { useAuthStore } from '../../stores/auth-store';

describe('AdminDrawer Component', () => {
  const mockLocation = { pathname: '/admin' };
  const mockToggleDrawer = vi.fn();

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
  });

  const setup = async (drawerOpen = true, isSuperAdmin = false) => {
    // Set the mock implementation for useAuthStore before rendering
    (useAuthStore as any).mockReturnValue({
      user: isSuperAdmin ? mockSuperAdminUser : mockUser
    });
    
    let renderResult;
    
    await act(async () => {
      renderResult = render(
        <MemoryRouter>
          <AdminDrawer 
            drawer={drawerOpen} 
            toggleDrawer={mockToggleDrawer} 
            location={mockLocation} 
          />
        </MemoryRouter>
      );
    });
    
    return renderResult;
  };

  it('renders without crashing', async () => {
    await setup();
    expect(screen.getByText('Admin User')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('displays user information when drawer is open', async () => {
    await setup(true);
    
    expect(screen.getByText('Admin User')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    
    // Check avatar - using container query since MUI Avatar doesn't have img role
    const avatar = screen.getByTestId('PersonIcon').closest('.MuiAvatar-root');
    expect(avatar).toHaveStyle({
      width: '72px',
      height: '72px',
    });
  });

  it('displays compact user information when drawer is closed', async () => {
    await setup(false);
    
    // Admin User text shouldn't be visible when drawer is closed
    expect(screen.queryByText('Admin User')).not.toBeInTheDocument();
    
    // Check avatar - using container query since MUI Avatar doesn't have img role
    const avatar = screen.getByTestId('PersonIcon').closest('.MuiAvatar-root');
    expect(avatar).toHaveStyle({
      width: '25px',
      height: '25px',
    });
  });

  it('renders correct admin role label based on user type', async () => {
    // Test for regular admin
    await setup(true, false);
    expect(screen.getByText('Admin')).toBeInTheDocument();
    
    // Cleanup
    vi.clearAllMocks();
    
    // Test for super admin
    await setup(true, true);
    // Use more specific selector since 'Super Admin' appears in multiple places
    const adminLabel = screen.getAllByText('Super Admin').find(
      element => element.tagName.toLowerCase() === 'p'
    );
    expect(adminLabel).toBeInTheDocument();
  });

  it('renders all standard menu items', async () => {
    await setup();
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Manage Students')).toBeInTheDocument();
    expect(screen.getByText('Manage Societies')).toBeInTheDocument();
    expect(screen.getByText('Manage Events')).toBeInTheDocument();
    expect(screen.getByText('Calendar')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
    
    // Create Admin should not be present for regular admin
    expect(screen.queryByText('Create Admin')).not.toBeInTheDocument();
  });

  it('includes Create Admin option for super admin', async () => {
    await setup(true, true);
    
    expect(screen.getByText('Create Admin')).toBeInTheDocument();
  });

  it('renders additional menu items', async () => {
    await setup();
    
    expect(screen.getByText('My Team')).toBeInTheDocument();
    expect(screen.getByText('Activity Log')).toBeInTheDocument();
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

  it('updates selected item when menu item is clicked', async () => {
    await setup();
    
    const dashboardLink = screen.getByText('Dashboard').closest('a');
    const manageStudentsLink = screen.getByText('Manage Students').closest('a');
    
    // Initially Dashboard should be selected
    expect(dashboardLink).toHaveClass('Mui-selected');
    
    // Click on Manage Students
    fireEvent.click(manageStudentsLink);
    
    // Now Manage Students should be selected
    expect(manageStudentsLink).toHaveClass('Mui-selected');
    expect(dashboardLink).not.toHaveClass('Mui-selected');
  });

  it('navigates to correct routes for main menu items', async () => {
    await setup();
    
    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveAttribute('href', '/admin');
    
    const manageStudentsLink = screen.getByText('Manage Students').closest('a');
    expect(manageStudentsLink).toHaveAttribute('href', '/admin/student-list');
    
    const manageSocietiesLink = screen.getByText('Manage Societies').closest('a');
    expect(manageSocietiesLink).toHaveAttribute('href', '/admin/society');
  });

  it('navigates to correct routes for additional menu items', async () => {
    await setup();
    
    const reportsLink = screen.getByText('Reports').closest('a');
    expect(reportsLink).toHaveAttribute('href', '/admin/reports');
    
    const calendarLink = screen.getByText('Calendar').closest('a');
    expect(calendarLink).toHaveAttribute('href', '/admin/calendar');
    
    const activityLogLink = screen.getByText('Activity Log').closest('a');
    expect(activityLogLink).toHaveAttribute('href', '/admin/activity-log');
  });

  it('navigates to create admin page for super admin', async () => {
    await setup(true, true);
    
    const createAdminLink = screen.getByText('Create Admin').closest('a');
    expect(createAdminLink).toHaveAttribute('href', '/admin/create-admin');
  });
});