import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PresidentDrawer from '../../../components/layout/PresidentDrawer';
import * as api from '../../../api';

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
    get: vi.fn().mockResolvedValue({ data: {} })
  }
}));

vi.mock('../../../components/layout/CustomDrawer', () => ({
  CustomDrawer: ({ children, open, ...props }) => (
    <div data-testid="custom-drawer" data-open={open ? "true" : "false"} {...props}>
      {children}
    </div>
  ),
  CustomDrawerHeader: ({ children }) => (
    <div data-testid="custom-drawer-header">{children}</div>
  ),
}));

const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('PresidentDrawer Component', () => {
  const defaultProps = {
    drawer: true,
    toggleDrawer: vi.fn(),
    location: { pathname: '/student' },
  };

  const mockStudentData = {
    first_name: 'John',
    last_name: 'Doe',
    username: 'johndoe',
    icon: 'https://example.com/avatar.png',
    president_of: 123,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    api.apiClient.get.mockResolvedValue({
      data: mockStudentData,
    });
  });

  it('renders correctly with student data', async () => {
    render(
      <BrowserRouter>
        <PresidentDrawer {...defaultProps} />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(api.apiClient.get).toHaveBeenCalledWith('/api/user/current');
    });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('President')).toBeInTheDocument();
    });

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('My Societies')).toBeInTheDocument();
    expect(screen.getByText('My Events')).toBeInTheDocument();
    expect(screen.getByText('Discover Societies')).toBeInTheDocument();
    expect(screen.getByText('Discover Events')).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Inbox')).toBeInTheDocument();
    expect(screen.getByText('Report')).toBeInTheDocument();
    expect(screen.getByText('Manage My Societies')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('renders the drawer in collapsed state when drawer prop is false', async () => {
    render(
      <BrowserRouter>
        <PresidentDrawer {...defaultProps} drawer={false} />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(api.apiClient.get).toHaveBeenCalledWith('/api/user/current');
    });

    await waitFor(() => {
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.queryByText('President')).not.toBeInTheDocument();
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('custom-drawer')).toHaveAttribute('data-open', 'false');
  });

  it('calls toggleDrawer when chevron icon is clicked', async () => {
    render(
      <BrowserRouter>
        <PresidentDrawer {...defaultProps} />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(api.apiClient.get).toHaveBeenCalledWith('/api/user/current');
    });

    const chevronIcon = screen.getByTestId('ChevronLeftIcon');
    const iconButton = chevronIcon.closest('button');
    fireEvent.click(iconButton);

    expect(defaultProps.toggleDrawer).toHaveBeenCalledTimes(1);
  });

  it('handles logout correctly', async () => {
    render(
      <BrowserRouter>
        <PresidentDrawer {...defaultProps} />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(api.apiClient.get).toHaveBeenCalledWith('/api/user/current');
    });

    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('access');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('refresh');
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('does not render Manage My Societies when user is not a president', async () => {
    api.apiClient.get.mockResolvedValueOnce({
      data: {
        ...mockStudentData,
        president_of: null,
      },
    });

    render(
      <BrowserRouter>
        <PresidentDrawer {...defaultProps} />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(api.apiClient.get).toHaveBeenCalledWith('/api/user/current');
    });

    await waitFor(() => {
      expect(screen.queryByText('Manage My Societies')).not.toBeInTheDocument();
    });
  });

  it('selects the correct menu item when clicked', async () => {
    render(
      <BrowserRouter>
        <PresidentDrawer {...defaultProps} />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(api.apiClient.get).toHaveBeenCalledWith('/api/user/current');
    });

    const mySocietiesLink = screen.getByText('My Societies');
    fireEvent.click(mySocietiesLink);

    const linkElement = mySocietiesLink.closest('a');
    expect(linkElement).toHaveAttribute('href', '/student/my-societies');
  });
});
