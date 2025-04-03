import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import LoginPage from '../Login';
import { apiClient, apiPaths } from '../../../api';
import { jwtDecode } from 'jwt-decode';
import { AuthContext } from '../../../context/AuthContext';

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

const mockLogin = vi.fn();
const mockUseAuth = () => ({
  login: mockLogin,
  logout: vi.fn(),
  user: null,
  isAuthenticated: false
});

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
  AuthContext: {
    Provider: ({ children }) => children
  }
}));

// Module-level variable for location state
let mockLocationState = null;

// Mock navigate function and location
const mockNavigate = vi.fn();

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
    // Set default location state to null so that tests expecting default redirect work as intended
    mockLocationState = null;
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
    
    apiClient.post.mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({ data: {} }), 100))
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
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    });
  });
  
  it('handles successful login for admin user', async () => {
    const user = userEvent.setup();
    const mockAccessToken = 'mock-access-token';
    const mockRefreshToken = 'mock-refresh-token';
    
    // For admin test, set a redirect in location state
    mockLocationState = { from: { pathname: '/test-redirect' } };
    
    apiClient.post.mockResolvedValueOnce({ 
      data: { 
        access: mockAccessToken, 
        refresh: mockRefreshToken 
      } 
    });
    
    // Use mockReturnValue so subsequent calls to jwtDecode get the same object
    jwtDecode.mockReturnValue({ user_id: 1, role: 'admin' });
    
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
      expect(mockLogin).toHaveBeenCalledWith(mockAccessToken, mockRefreshToken);
      expect(jwtDecode).toHaveBeenCalledWith(mockAccessToken);
      expect(mockNavigate).toHaveBeenCalled();
    });
    
    // With redirect provided, expect '/test-redirect'
    expect(mockNavigate.mock.calls[0][0]).toBe('/test-redirect');
  });
  
  it('handles successful login for student user with default navigation', async () => {
    const user = userEvent.setup();
    
    // For student test, ensure no redirect is provided by leaving location state as null
    mockLocationState = null;
    
    apiClient.post.mockResolvedValueOnce({ 
      data: { 
        access: 'student-token', 
        refresh: 'refresh-token' 
      } 
    });
    
    jwtDecode.mockReturnValue({ user_id: 2, role: 'student' });
    
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
      expect(mockNavigate).toHaveBeenCalled();
    });
    
    // With no redirect provided, the component should default to '/student'
    expect(mockNavigate.mock.calls[0][0]).toBe('/student');
  });
  
  it('handles login failure', async () => {
    const user = userEvent.setup();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    apiClient.post.mockRejectedValueOnce(new Error('Login failed'));
    
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
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.getByText('Login failed. Please check your username and password.')).toBeInTheDocument();
      expect(consoleSpy).toHaveBeenCalled();
    });
    
    consoleSpy.mockRestore();
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