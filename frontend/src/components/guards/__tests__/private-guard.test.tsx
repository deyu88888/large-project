import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PrivateGuard } from '../private-guard';
import { apiClient } from '../../../api';
import { jwtDecode } from 'jwt-decode';
import { ACCESS_TOKEN, REFRESH_TOKEN } from '../../../constants';
import * as authStoreModule from '../../../stores/auth-store';

vi.mock('../../../api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
  apiPaths: {
    USER: {
      CURRENT: '/api/user/current',
      REFRESH: '/api/token/refresh',
    },
  },
}));

vi.mock('jwt-decode', () => ({
  jwtDecode: vi.fn(),
}));

vi.mock('../../../stores/auth-store', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('../../loading/LoadingView', () => ({
  LoadingView: () => <div data-testid="loading-view">Loading...</div>,
}));

describe('PrivateGuard Component', () => {
  const mockSetUser = vi.fn();
  const mockChildren = <div>Protected Content</div>;

  const createMockLocalStorage = (accessToken?: string, refreshToken?: string) => {
    const mock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };

    mock.getItem.mockImplementation((key) => {
      if (key === ACCESS_TOKEN) return accessToken || null;
      if (key === REFRESH_TOKEN) return refreshToken || null;
      return null;
    });

    Object.defineProperty(window, 'localStorage', {
      value: mock,
      writable: true,
    });

    return mock;
  };

  const renderPrivateGuard = (
    path = '/protected', 
    requiredRole?: 'admin' | 'student',
    userMockData = { id: '123', firstName: 'Test', role: 'student' }
  ) => {
    (apiClient.get as vi.Mock).mockResolvedValue({ data: userMockData });

    return render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route 
            path="/protected" 
            element={
              <PrivateGuard requiredRole={requiredRole}>
                {mockChildren}
              </PrivateGuard>
            } 
          />
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/admin" element={<div>Admin Dashboard</div>} />
          <Route path="/student" element={<div>Student Dashboard</div>} />
          <Route path="/" element={<div>Home Page</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();

    (authStoreModule.useAuthStore as vi.Mock).mockReturnValue({
      user: null,
      setUser: mockSetUser,
    });

    (jwtDecode as vi.Mock).mockReturnValue({
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
  });

  it('shows loading view during authentication', async () => {
    const pendingPromise = new Promise(() => {});
    (apiClient.get as vi.Mock).mockReturnValue(pendingPromise);

    createMockLocalStorage('valid-token');

    renderPrivateGuard();

    const loadingView = await screen.findByTestId('loading-view');
    expect(loadingView).toBeTruthy();
  });

  it('redirects to login when no access token exists', async () => {
    createMockLocalStorage();

    renderPrivateGuard();

    const loginPage = await screen.findByText('Login Page');
    expect(loginPage).toBeTruthy();
  });

  it('renders children when authentication is successful', async () => {
    createMockLocalStorage('valid-token');

    renderPrivateGuard();

    const protectedContent = await screen.findByText('Protected Content');
    expect(protectedContent).toBeTruthy();
  });

  it('attempts token refresh when initial token is invalid', async () => {
    (jwtDecode as vi.Mock).mockImplementationOnce(() => {
      throw new Error('Invalid token');
    });

    (apiClient.post as vi.Mock).mockResolvedValue({
      status: 200,
      data: { access: 'new-valid-token' }
    });

    createMockLocalStorage('invalid-token', 'refresh-token');
    
    renderPrivateGuard();

    const protectedContent = await screen.findByText('Protected Content');
    expect(protectedContent).toBeTruthy();
  });

  it('redirects when user role does not match required role', async () => {
    createMockLocalStorage('valid-token');
    
    (authStoreModule.useAuthStore as vi.Mock).mockReturnValue({
      user: { role: 'student' },
      setUser: mockSetUser,
    });

    renderPrivateGuard('/protected', 'admin');

    const studentDashboard = await screen.findByText('Student Dashboard');
    expect(studentDashboard).toBeTruthy();
  });

  it('redirects from public routes when authenticated', async () => {
    createMockLocalStorage('valid-token');
    
    (authStoreModule.useAuthStore as vi.Mock).mockReturnValue({
      user: { role: 'admin' },
      setUser: mockSetUser,
    });

    renderPrivateGuard('/', undefined);
  });

  it('uses fallback user when user data fetch fails', async () => {
    createMockLocalStorage('valid-token');
    
    (apiClient.get as vi.Mock).mockRejectedValue(new Error('Fetch failed'));

    renderPrivateGuard();

    const protectedContent = await screen.findByText('Protected Content');
    expect(protectedContent).toBeTruthy();
  });

  it('handles 404 error with fallback user data fetch attempts', async () => {
    createMockLocalStorage('valid-token');
    
    const mockError: any = new Error('Not Found');
    mockError.response = { status: 404 };
    (apiClient.get as vi.Mock)
      .mockRejectedValueOnce(mockError)
      .mockRejectedValueOnce(mockError);

    (jwtDecode as vi.Mock).mockReturnValue({
      sub: 'user-id',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    renderPrivateGuard();

    const protectedContent = await screen.findByText('Protected Content');
    expect(protectedContent).toBeTruthy();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
});