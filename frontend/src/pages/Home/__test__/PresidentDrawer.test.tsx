import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import PresidentDrawer from '../../../components/layout/PresidentDrawer';
import { apiClient } from '../../../api';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../../api', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

vi.mock('../../../components/layout/CustomDrawer', () => ({
  CustomDrawer: ({ children, open }: { children: React.ReactNode, open: boolean }) => <div data-testid="custom-drawer" data-open={open}>{children}</div>,
  CustomDrawerHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="custom-drawer-header">{children}</div>,
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

    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        removeItem: vi.fn(),
        setItem: vi.fn(),
      },
      writable: true,
    });

    vi.mocked(apiClient.get).mockResolvedValue({ data: mockStudentData });
  });

  const setup = async (drawerOpen = true) => {
    render(
      <MemoryRouter>
        <PresidentDrawer
          drawer={drawerOpen}
          toggleDrawer={mockToggleDrawer}
          location={mockLocation}
        />
      </MemoryRouter>
    );
    await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledWith('/api/user/current');
    });
    if(drawerOpen) {
        await screen.findByText('Test User', {}, { timeout: 3000 });
    } else {
        await screen.findByTestId('HomeOutlinedIcon', {}, { timeout: 3000 });
    }
  };

  it('renders without crashing', async () => {
    await setup();
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
  });

  it('fetches student data on mount', async () => {
    await setup();
    expect(apiClient.get).toHaveBeenCalledWith('/api/user/current');
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

   it('displays user information when drawer is open', async () => {
    await setup(true);
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('President')).toBeInTheDocument();
    const userIcon = screen.getByAltText(`${mockStudentData.username} icon`);
    expect(userIcon).toBeInTheDocument();
    expect(userIcon).toBeVisible();
  });

  it('displays compact user information when drawer is closed', async () => {
    await setup(false);
    const userIcon = screen.getByAltText(`${mockStudentData.username} icon`);
    expect(userIcon).toBeInTheDocument();
    expect(userIcon).toBeVisible();
    expect(screen.queryByText('Test User')).not.toBeInTheDocument();
    expect(screen.queryByText('President')).not.toBeInTheDocument();
  });

  it('renders all main menu items', async () => {
    await setup();
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'My Societies' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'My Events' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Discover Societies' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Discover Events' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'News' })).not.toBeInTheDocument();
  });

  it('renders management menu items when user is president', async () => {
    await setup();
    expect(screen.getByRole('link', { name: 'Manage My Societies' })).toBeInTheDocument();
  });

    it('does NOT render management menu items when user is not president', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: { ...mockStudentData, president_of: null },
    });
     render(
      <MemoryRouter>
        <PresidentDrawer
          drawer={true}
          toggleDrawer={mockToggleDrawer}
          location={mockLocation}
        />
      </MemoryRouter>
    );
     await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledWith('/api/user/current');
     });
     await screen.findByText('Test User', {}, { timeout: 3000 });
    expect(screen.queryByRole('link', { name: 'Manage My Societies' })).not.toBeInTheDocument();
  });


  it('renders bottom menu items', async () => {
    await setup();
    expect(screen.getByRole('link', { name: 'Notifications' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Inbox' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Report' })).toBeInTheDocument();
  });

  it('renders the logout button', async () => {
    await setup();
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });

  it('calls toggleDrawer when chevron button is clicked', async () => {
    await setup(true);
    const chevronIcon = screen.getByTestId('ChevronLeftIcon');
    const chevronButton = chevronIcon.closest('button');
    expect(chevronButton).toBeInTheDocument();

    if (chevronButton) {
        fireEvent.click(chevronButton);
    }
    expect(mockToggleDrawer).toHaveBeenCalledTimes(1);
  });

  it('handles logout correctly', async () => {
    await setup();
    const logoutButton = screen.getByRole('button', { name: /logout/i });
    fireEvent.click(logoutButton);
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('access');
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('refresh');
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

   it('handles API error when fetching student data', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Failed to fetch'));

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
      expect(apiClient.get).toHaveBeenCalledWith('/api/user/current');
    });
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error retrieving student:', expect.any(Error));
      expect(alertMock).toHaveBeenCalledWith('Failed to retrieve student. Please contact an administrator.');
    });

    consoleErrorSpy.mockRestore();
    alertMock.mockRestore();
  });

  it('updates selected item when menu item is clicked', async () => {
    await setup();
    const dashboardLink = screen.getByRole('link', { name: 'Dashboard' });
    const mySocietiesLink = screen.getByRole('link', { name: 'My Societies' });

    expect(dashboardLink).toHaveClass('Mui-selected');
    expect(mySocietiesLink).not.toHaveClass('Mui-selected');

    fireEvent.click(mySocietiesLink);

    const updatedDashboardLink = screen.getByRole('link', { name: 'Dashboard' });
    const updatedMySocietiesLink = screen.getByRole('link', { name: 'My Societies' });

    expect(updatedMySocietiesLink).toHaveClass('Mui-selected');
    expect(updatedDashboardLink).not.toHaveClass('Mui-selected');
  });

   it('navigates to correct routes for main menu items', async () => {
    await setup();
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/student');
    expect(screen.getByRole('link', { name: 'My Societies' })).toHaveAttribute('href', '/student/my-societies');
    expect(screen.getByRole('link', { name: 'My Events' })).toHaveAttribute('href', '/student/view-events');
    expect(screen.getByRole('link', { name: 'Discover Societies' })).toHaveAttribute('href', '/student/join-society');
    expect(screen.getByRole('link', { name: 'Discover Events' })).toHaveAttribute('href', '/student/all-events');
  });

  it('navigates to the correct route for managing societies', async () => {
    await setup();
    expect(screen.getByRole('link', { name: 'Manage My Societies' })).toHaveAttribute('href', '/president-page/1');
  });

});