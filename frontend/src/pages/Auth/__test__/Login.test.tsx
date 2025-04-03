import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import LoginPage from '../Login';
import { apiClient, apiPaths } from '../../../api';
import { jwtDecode } from 'jwt-decode';

vi.mock('../../../api', () => ({
  apiClient: {
    post: vi.fn()
  },
  apiPaths: {
    USER: {
      LOGIN: '/api/user/login',
    },
  },
}));

vi.mock('jwt-decode', () => ({
  jwtDecode: vi.fn(),
}));

const localStorageMock = (() => {
  let store = {};
  
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = String(value);
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

const mockNavigate = vi.fn();
let mockLocationState = { from: { pathname: '/test-redirect' } };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: mockLocationState }),
  };
});

describe('LoginPage', () => {
  const theme = createTheme();
  
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    mockLocationState = { from: { pathname: '/test-redirect' } };
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  it('renders login form correctly', () => {
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </ThemeProvider>
    );
    
    expect(screen.getByTestId('login-heading')).toHaveTextContent('Login');
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByTestId('login-button')).toBeInTheDocument();
    expect(screen.getByText(/need to sign up\?/i)).toBeInTheDocument();
    expect(screen.getByText(/please register/i)).toBeInTheDocument();
  });
  
  it('handles form input changes', async () => {
    const user = userEvent.setup();
    
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </ThemeProvider>
    );
    
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'password123');
    
    expect(usernameInput).toHaveValue('testuser');
    expect(passwordInput).toHaveValue('password123');
  });
  
  it('toggles password visibility when clicking the visibility icon', async () => {
    const user = userEvent.setup();
    
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </ThemeProvider>
    );
    
    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    const visibilityToggle = screen.getByRole('button', { name: '' });
    await user.click(visibilityToggle);
    
    expect(passwordInput).toHaveAttribute('type', 'text');
    
    await user.click(visibilityToggle);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
  
  it('shows loading indicator during form submission', async () => {
    const user = userEvent.setup();
    
    apiClient.post = vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ data: {} }), 10000))
    );
    
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </ThemeProvider>
    );
    
    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    
    await user.click(screen.getByTestId('login-button'));
    
    await waitFor(() => {
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });
  
  it('handles successful login for admin user', async () => {
    const user = userEvent.setup();
    const mockAccessToken = 'mock-access-token';
    const mockRefreshToken = 'mock-refresh-token';
    
    apiClient.post = vi.fn().mockImplementation(() => {
      return Promise.resolve({ 
        data: { 
          access: mockAccessToken, 
          refresh: mockRefreshToken 
        } 
      });
    });
    
    jwtDecode.mockReturnValueOnce({ user_id: 1, role: 'admin' });
    
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </ThemeProvider>
    );
    
    await user.type(screen.getByLabelText(/username/i), 'admin');
    await user.type(screen.getByLabelText(/password/i), 'admin123');
    
    await user.click(screen.getByTestId('login-button'));
    
    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/api/user/login', { 
        username: 'admin', 
        password: 'admin123' 
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith('access', mockAccessToken);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('refresh', mockRefreshToken);
      expect(jwtDecode).toHaveBeenCalledWith(mockAccessToken);
      expect(mockNavigate).toHaveBeenCalledWith('/test-redirect', { replace: true });
    });
  });
  
  it('handles successful login for student user with default navigation', async () => {
    const user = userEvent.setup();
    
    mockLocationState = null;
    
    apiClient.post = vi.fn().mockImplementation(() => {
      return Promise.resolve({ 
        data: { 
          access: 'student-token', 
          refresh: 'refresh-token' 
        } 
      });
    });
    
    jwtDecode.mockReturnValueOnce({ user_id: 2, role: 'student' });
    
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </ThemeProvider>
    );
    
    await user.type(screen.getByLabelText(/username/i), 'student');
    await user.type(screen.getByLabelText(/password/i), 'student123');
    
    await user.click(screen.getByTestId('login-button'));
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/student', { replace: true });
    });
  });
  
  it('handles login failure', async () => {
    const user = userEvent.setup();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const alertMock = vi.fn();
    window.alert = alertMock;
    
    apiClient.post = vi.fn().mockImplementation(() => {
      return Promise.reject(new Error('Login failed'));
    });
    
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </ThemeProvider>
    );
    
    await user.type(screen.getByLabelText(/username/i), 'wronguser');
    await user.type(screen.getByLabelText(/password/i), 'wrongpass');
    
    await user.click(screen.getByTestId('login-button'));
    
    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/api/user/login', { 
        username: 'wronguser', 
        password: 'wrongpass' 
      });
      expect(alertMock).toHaveBeenCalledWith('Login failed. Please check your username and password.');
      expect(consoleSpy).toHaveBeenCalled();
    });
    
    consoleSpy.mockRestore();
    window.alert = global.alert; // Restore original alert
  });
  
  it('navigates to register page when clicking the register link', async () => {
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </ThemeProvider>
    );
    
    const registerLink = screen.getByText(/please register/i);
    expect(registerLink).toHaveAttribute('href', '/register');
  });
});