import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PublicGuard } from '../public-guard';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import * as authStoreModule from '../../../stores/auth-store';
import { ACCESS_TOKEN } from '../../../constants';

vi.mock('jwt-decode', () => ({
  jwtDecode: vi.fn(),
}));

vi.mock('../../../stores/auth-store', () => {
  const actual = vi.importActual('../../../stores/auth-store');
  return {
    ...actual,
    useAuthStore: vi.fn()
  };
});

vi.mock('../loading/LoadingView', () => ({
  LoadingView: () => <div data-testid="loading-view">Loading...</div>,
}));

describe('PublicGuard', () => {
  const mockSetUser = vi.fn();
  
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    
    vi.mocked(authStoreModule.useAuthStore).mockReturnValue({
      user: null,
      setUser: mockSetUser,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading view initially', async () => {
    vi.mock('../loading/LoadingView', () => ({
      LoadingView: () => <div data-testid="loading-view">Loading...</div>,
    }));

    render(
      <MemoryRouter>
        <PublicGuard>
          <div data-testid="public-content">Public Content</div>
        </PublicGuard>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('public-content')).toBeInTheDocument();
    });
  });

  it('should render children when user is not authenticated', async () => {
    render(
      <MemoryRouter>
        <PublicGuard>
          <div data-testid="public-content">Public Content</div>
        </PublicGuard>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('public-content')).toBeInTheDocument();
    });
  });

  it('should redirect to /student when user is authenticated as student', async () => {
    const mockToken = 'valid.token.here';
    localStorage.setItem(ACCESS_TOKEN, mockToken);
    
    vi.mocked(jwtDecode).mockReturnValue({
      exp: Date.now() / 1000 + 3600,
      user_id: 123,
      role: 'student'
    });

    vi.mocked(authStoreModule.useAuthStore).mockReturnValue({
      user: {
        id: 123,
        username: 'testuser',
        role: 'student',
        is_active: true,
        is_president: false,
        is_vice_president: false,
        is_super_admin: false,
      },
      setUser: mockSetUser,
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={
            <PublicGuard>
              <div data-testid="public-content">Login Page</div>
            </PublicGuard>
          } />
          <Route path="/student" element={<div data-testid="student-dashboard">Student Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('student-dashboard')).toBeInTheDocument();
    });
  });

  it('should redirect to /admin when user is authenticated as admin', async () => {
    const mockToken = 'valid.admin.token';
    localStorage.setItem(ACCESS_TOKEN, mockToken);
    
    vi.mocked(jwtDecode).mockReturnValue({
      exp: Date.now() / 1000 + 3600,
      user_id: 456,
      role: 'admin'
    });

    vi.mocked(authStoreModule.useAuthStore).mockReturnValue({
      user: {
        id: 456,
        username: 'adminuser',
        role: 'admin',
        is_active: true,
        is_president: false,
        is_vice_president: false,
        is_super_admin: false,
      },
      setUser: mockSetUser,
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={
            <PublicGuard>
              <div data-testid="public-content">Login Page</div>
            </PublicGuard>
          } />
          <Route path="/admin" element={<div data-testid="admin-dashboard">Admin Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument();
    });
  });

  it('should redirect to root when user has unknown role', async () => {
    const mockToken = 'valid.unknown.token';
    localStorage.setItem(ACCESS_TOKEN, mockToken);
    
    vi.mocked(jwtDecode).mockReturnValue({
      exp: Date.now() / 1000 + 3600,
      user_id: 789,
      role: 'unknown'
    });

    vi.mocked(authStoreModule.useAuthStore).mockReturnValue({
      user: {
        id: 789,
        username: 'unknownuser',
        role: 'unknown',
        is_active: true,
        is_president: false,
        is_vice_president: false,
        is_super_admin: false,
      },
      setUser: mockSetUser,
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={
            <PublicGuard>
              <div data-testid="public-content">Login Page</div>
            </PublicGuard>
          } />
          <Route path="/" element={<div data-testid="root-page">Root Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('root-page')).toBeInTheDocument();
    });
  });

  it('should show loading view when authorized but user data is not available', async () => {
    vi.mock('../loading/LoadingView', () => ({
      LoadingView: () => <div data-testid="auth-loading-view">Auth Loading...</div>
    }));
    
    const mockToken = 'valid.token.here';
    localStorage.setItem(ACCESS_TOKEN, mockToken);
    
    vi.mocked(jwtDecode).mockReturnValue({
      exp: Date.now() / 1000 + 3600,
      user_id: 123,
      role: 'student'
    });

    let mockUserValue = null;
    const mockSetUser = vi.fn().mockImplementation((user) => {
      mockUserValue = null;
    });

    vi.mocked(authStoreModule.useAuthStore).mockImplementation(() => ({
      user: mockUserValue,
      setUser: mockSetUser
    }));

    const { rerender } = render(
      <MemoryRouter>
        <PublicGuard>
          <div data-testid="public-content">Public Content</div>
        </PublicGuard>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockSetUser).toHaveBeenCalled();
    });

    expect(mockSetUser).toHaveBeenCalledWith(expect.objectContaining({
      id: 123,
      role: 'student'
    }));
  });

  it('should handle expired token by showing public content', async () => {
    const mockToken = 'expired.token.here';
    localStorage.setItem(ACCESS_TOKEN, mockToken);
    
    vi.mocked(jwtDecode).mockReturnValue({
      exp: Date.now() / 1000 - 3600,
      user_id: 123,
      role: 'student'
    });

    render(
      <MemoryRouter>
        <PublicGuard>
          <div data-testid="public-content">Public Content</div>
        </PublicGuard>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('public-content')).toBeInTheDocument();
    });
    
    expect(localStorage.getItem(ACCESS_TOKEN)).toBeNull();
  });

  it('should handle invalid token by showing public content', async () => {
    const mockToken = 'invalid.token.here';
    localStorage.setItem(ACCESS_TOKEN, mockToken);
    
    vi.mocked(jwtDecode).mockImplementation(() => {
      throw new Error('Invalid token');
    });

    render(
      <MemoryRouter>
        <PublicGuard>
          <div data-testid="public-content">Public Content</div>
        </PublicGuard>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('public-content')).toBeInTheDocument();
    });
    
    expect(localStorage.getItem(ACCESS_TOKEN)).toBeNull();
  });

  it('should set minimal user from token when user is not in store', async () => {
    const mockToken = 'valid.token.here';
    localStorage.setItem(ACCESS_TOKEN, mockToken);
    
    vi.mocked(jwtDecode).mockReturnValue({
      exp: Date.now() / 1000 + 3600,
      user_id: 123,
      role: 'student'
    });

    let authUser = null;
    vi.mocked(authStoreModule.useAuthStore).mockReturnValue({
      user: authUser,
      setUser: mockSetUser,
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={
            <PublicGuard>
              <div data-testid="public-content">Login Page</div>
            </PublicGuard>
          } />
          <Route path="/student" element={<div data-testid="student-dashboard">Student Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockSetUser).toHaveBeenCalledWith(expect.objectContaining({
        id: 123,
        role: 'student'
      }));
    });
  });
});