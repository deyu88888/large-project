import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminDrawer from '../../../components/layout/AdminDrawer';
import * as authStore from '../../../stores/auth-store';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../../stores/auth-store', () => ({
  useAuthStore: vi.fn(),
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

describe('AdminDrawer Component', () => {
  const defaultProps = {
    drawer: true,
    toggleDrawer: vi.fn(),
    location: { pathname: '/admin' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly for regular admin', () => {
    vi.spyOn(authStore, 'useAuthStore').mockImplementation(() => ({
      user: {
        first_name: 'John',
        last_name: 'Doe',
        is_super_admin: false,
      },
    }));

    render(
      <BrowserRouter>
        <AdminDrawer {...defaultProps} />
      </BrowserRouter>
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Manage Students')).toBeInTheDocument();
    expect(screen.queryByText('Create Admin')).not.toBeInTheDocument();
  });

  it('renders correctly for super admin', () => {
    vi.spyOn(authStore, 'useAuthStore').mockImplementation(() => ({
      user: {
        first_name: 'Jane',
        last_name: 'Smith',
        is_super_admin: true,
      },
    }));

    render(
      <BrowserRouter>
        <AdminDrawer {...defaultProps} />
      </BrowserRouter>
    );

    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Super Admin')).toBeInTheDocument();
    expect(screen.getByText('Create Admin')).toBeInTheDocument();
  });

  it('calls toggleDrawer when chevron icon is clicked', () => {
    vi.spyOn(authStore, 'useAuthStore').mockImplementation(() => ({
      user: {
        first_name: 'John',
        last_name: 'Doe',
        is_super_admin: false,
      },
    }));

    render(
      <BrowserRouter>
        <AdminDrawer {...defaultProps} />
      </BrowserRouter>
    );

    const chevronButton = screen.getByTestId('ChevronLeftIcon').closest('button');
    fireEvent.click(chevronButton);
    expect(defaultProps.toggleDrawer).toHaveBeenCalledTimes(1);
  });

  it('handles logout correctly', () => {
    vi.spyOn(authStore, 'useAuthStore').mockImplementation(() => ({
      user: {
        first_name: 'John',
        last_name: 'Doe',
        is_super_admin: false,
      },
    }));

    render(
      <BrowserRouter>
        <AdminDrawer {...defaultProps} />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText('Logout'));
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('access');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('refresh');
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('displays collapsed drawer when drawer prop is false', () => {
    vi.spyOn(authStore, 'useAuthStore').mockImplementation(() => ({
      user: {
        first_name: 'John',
        last_name: 'Doe',
        is_super_admin: false,
      },
    }));

    render(
      <BrowserRouter>
        <AdminDrawer {...defaultProps} drawer={false} />
      </BrowserRouter>
    );

    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('selects the correct menu item when clicked', () => {
    vi.spyOn(authStore, 'useAuthStore').mockImplementation(() => ({
      user: {
        first_name: 'John',
        last_name: 'Doe',
        is_super_admin: false,
      },
    }));

    render(
      <BrowserRouter>
        <AdminDrawer {...defaultProps} />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText('Manage Students'));
    const studentListItem = screen.getByText('Manage Students').closest('a');
    expect(studentListItem).toHaveAttribute('href', '/admin/student-list');
  });
});