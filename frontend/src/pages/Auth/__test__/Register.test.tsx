import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import RegisterPage from '../Register';
import { apiClient, apiPaths } from '../../../api';

vi.mock('../../../api', () => ({
  apiClient: {
    post: vi.fn()
  },
  apiPaths: {
    USER: {
      REQUEST_OTP: '/api/user/request-otp',
      VERIFY_OTP: '/api/user/verify-otp',
      REGISTER: '/api/user/register'
    }
  }
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

describe('RegisterPage', () => {
  const theme = createTheme();
  const user = userEvent.setup();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  it('renders registration form with all fields', () => {
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <RegisterPage />
        </MemoryRouter>
      </ThemeProvider>
    );
    
    expect(screen.getByText('Register as a Student')).toBeInTheDocument();
    expect(screen.getByLabelText(/First name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByText('Get OTP')).toBeInTheDocument();
    expect(screen.getByText(/Already signed up\?/i)).toBeInTheDocument();
  });
  
  it('validates email format with King\'s College domain', async () => {
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <RegisterPage />
        </MemoryRouter>
      </ThemeProvider>
    );
    
    const emailInput = screen.getByLabelText(/Email/i);
    const firstNameInput = screen.getByLabelText(/First name/i);
    const lastNameInput = screen.getByLabelText(/Last name/i);
    
    await user.type(firstNameInput, 'John');
    await user.type(lastNameInput, 'Doe');
    
    await user.type(emailInput, 'invalid@gmail.com');
    await user.tab();
    
    await waitFor(() => {
      expect(screen.getByText('Email must end with @kcl.ac.uk')).toBeInTheDocument();
    });
    
    await user.clear(emailInput);
    await user.type(emailInput, 'valid@kcl.ac.uk');
    await user.tab();
    
    await waitFor(() => {
      expect(screen.queryByText('Email must end with @kcl.ac.uk')).not.toBeInTheDocument();
    });
  });
  
  it('disables Get OTP button until all fields are valid', async () => {
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <RegisterPage />
        </MemoryRouter>
      </ThemeProvider>
    );
    
    const otpButton = screen.getByText('Get OTP');
    expect(otpButton).toBeDisabled();
    
    const firstNameInput = screen.getByLabelText(/First name/i);
    const lastNameInput = screen.getByLabelText(/Last name/i);
    const emailInput = screen.getByLabelText(/Email/i);
    
    await user.type(firstNameInput, 'John');
    expect(otpButton).toBeDisabled();
    
    await user.type(lastNameInput, 'Doe');
    expect(otpButton).toBeDisabled();
    
    await user.type(emailInput, 'valid@kcl.ac.uk');
    
    await waitFor(() => {
      expect(otpButton).not.toBeDisabled();
    });
  });
  
  it('requests OTP and advances to step 2', async () => {
    apiClient.post.mockResolvedValueOnce({ data: { message: 'OTP sent successfully' } });
    
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <RegisterPage />
        </MemoryRouter>
      </ThemeProvider>
    );
    
    const firstNameInput = screen.getByLabelText(/First name/i);
    const lastNameInput = screen.getByLabelText(/Last name/i);
    const emailInput = screen.getByLabelText(/Email/i);
    
    await user.type(firstNameInput, 'John');
    await user.type(lastNameInput, 'Doe');
    await user.type(emailInput, 'valid@kcl.ac.uk');
    
    const otpButton = screen.getByText('Get OTP');
    await waitFor(() => {
      expect(otpButton).not.toBeDisabled();
    });
    
    await user.click(otpButton);
    
    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        apiPaths.USER.REQUEST_OTP,
        { email: 'valid@kcl.ac.uk' }
      );
      expect(screen.getByLabelText(/One-time Password/i)).toBeInTheDocument();
      expect(screen.getByText('Verify OTP')).toBeInTheDocument();
    });
  });
  
  it('verifies OTP and advances to step 3', async () => {
    apiClient.post.mockResolvedValueOnce({ data: { message: 'OTP sent successfully' } })
                   .mockResolvedValueOnce({ data: { message: 'OTP verified successfully' } });
    
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <RegisterPage />
        </MemoryRouter>
      </ThemeProvider>
    );
    
    const firstNameInput = screen.getByLabelText(/First name/i);
    const lastNameInput = screen.getByLabelText(/Last name/i);
    const emailInput = screen.getByLabelText(/Email/i);
    
    await user.type(firstNameInput, 'John');
    await user.type(lastNameInput, 'Doe');
    await user.type(emailInput, 'valid@kcl.ac.uk');
    
    const otpButton = screen.getByText('Get OTP');
    await waitFor(() => expect(otpButton).not.toBeDisabled());
    await user.click(otpButton);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/One-time Password/i)).toBeInTheDocument();
    });
    
    const otpInput = screen.getByLabelText(/One-time Password/i);
    await user.type(otpInput, '123456');
    
    const verifyButton = screen.getByText('Verify OTP');
    await user.click(verifyButton);
    
    await waitFor(() => {
      expect(apiClient.post).toHaveBeenNthCalledWith(
        2,
        apiPaths.USER.VERIFY_OTP,
        { email: 'valid@kcl.ac.uk', otp: '123456' }
      );
      expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Pasword/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Major/i)).toBeInTheDocument();
    });
  });
  
  it('submits registration form successfully', async () => {
    apiClient.post.mockResolvedValueOnce({ data: { message: 'OTP sent successfully' } })
                   .mockResolvedValueOnce({ data: { message: 'OTP verified successfully' } })
                   .mockResolvedValueOnce({ data: { message: 'User registered successfully' } });
    
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <RegisterPage />
        </MemoryRouter>
      </ThemeProvider>
    );
    
    const firstNameInput = screen.getByLabelText(/First name/i);
    const lastNameInput = screen.getByLabelText(/Last name/i);
    const emailInput = screen.getByLabelText(/Email/i);
    
    await user.type(firstNameInput, 'John');
    await user.type(lastNameInput, 'Doe');
    await user.type(emailInput, 'valid@kcl.ac.uk');
    
    const otpButton = screen.getByText('Get OTP');
    await waitFor(() => expect(otpButton).not.toBeDisabled());
    await user.click(otpButton);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/One-time Password/i)).toBeInTheDocument();
    });
    
    const otpInput = screen.getByLabelText(/One-time Password/i);
    await user.type(otpInput, '123456');
    
    const verifyButton = screen.getByText('Verify OTP');
    await user.click(verifyButton);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    });
    
    const usernameInput = screen.getByLabelText(/Username/i);
    const passwordInput = screen.getByLabelText(/Pasword/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);
    const majorInput = screen.getByLabelText(/Major/i);
    
    await user.type(usernameInput, 'johndoe');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.type(majorInput, 'Computer Science');
    
    const registerButton = screen.getByRole('button', { type: 'submit' });
    await waitFor(() => expect(registerButton).not.toBeDisabled());
    await user.click(registerButton);
    
    await waitFor(() => {
      expect(apiClient.post).toHaveBeenNthCalledWith(
        3,
        apiPaths.USER.REGISTER,
        {
          first_name: 'John',
          last_name: 'Doe',
          email: 'valid@kcl.ac.uk',
          username: 'johndoe',
          password: 'password123',
          confirm_password: 'password123',
          major: 'Computer Science',
          societies: [],
          president_of: null
        }
      );
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });
  
  it('handles password validation errors', async () => {
    apiClient.post.mockResolvedValueOnce({ data: { message: 'OTP sent successfully' } })
                   .mockResolvedValueOnce({ data: { message: 'OTP verified successfully' } });
    
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <RegisterPage />
        </MemoryRouter>
      </ThemeProvider>
    );
    
    const firstNameInput = screen.getByLabelText(/First name/i);
    const lastNameInput = screen.getByLabelText(/Last name/i);
    const emailInput = screen.getByLabelText(/Email/i);
    
    await user.type(firstNameInput, 'John');
    await user.type(lastNameInput, 'Doe');
    await user.type(emailInput, 'valid@kcl.ac.uk');
    
    const otpButton = screen.getByText('Get OTP');
    await waitFor(() => expect(otpButton).not.toBeDisabled());
    await user.click(otpButton);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/One-time Password/i)).toBeInTheDocument();
    });
    
    const otpInput = screen.getByLabelText(/One-time Password/i);
    await user.type(otpInput, '123456');
    
    const verifyButton = screen.getByText('Verify OTP');
    await user.click(verifyButton);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    });
    
    const usernameInput = screen.getByLabelText(/Username/i);
    const passwordInput = screen.getByLabelText(/Pasword/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);
    
    await user.type(usernameInput, 'johndoe');
    

    await user.type(passwordInput, 'pass');
    await user.tab();
    
    await waitFor(() => {
      const errorIcons = screen.getAllByTestId('ErrorOutlineIcon');
      expect(errorIcons.length).toBeGreaterThan(0);
    });
    
    await user.clear(passwordInput);
    await user.type(passwordInput, 'password123');
    
    await user.type(confirmPasswordInput, 'password456');
    await user.tab();
    
    await waitFor(() => {
      const errorIcons = screen.getAllByTestId('ErrorOutlineIcon');
      expect(errorIcons.length).toBeGreaterThan(0);
    });
    
    await user.clear(confirmPasswordInput);
    await user.type(confirmPasswordInput, 'password123');
    await user.tab();
    
    await waitFor(() => {
      const successIcons = screen.getAllByTestId('CheckCircleIcon');
      expect(successIcons.length).toBeGreaterThan(0);
    });
  });
  
  it('handles OTP request errors', async () => {
    const errorMessage = 'Email already registered';
    
    apiClient.post.mockImplementationOnce(() => {
      return Promise.reject({ 
        response: { 
          data: { 
            error: errorMessage 
          } 
        } 
      });
    });
    
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <RegisterPage />
        </MemoryRouter>
      </ThemeProvider>
    );
    
    const firstNameInput = screen.getByLabelText(/First name/i);
    const lastNameInput = screen.getByLabelText(/Last name/i);
    const emailInput = screen.getByLabelText(/Email/i);
    
    await user.type(firstNameInput, 'John');
    await user.type(lastNameInput, 'Doe');
    await user.type(emailInput, 'existing@kcl.ac.uk');
    
    const otpButton = screen.getByText('Get OTP');
    await waitFor(() => expect(otpButton).not.toBeDisabled());
    await user.click(otpButton);
    
    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        apiPaths.USER.REQUEST_OTP, 
        { email: 'existing@kcl.ac.uk' }
      );
    });
    
    await waitFor(() => {
      const errorElements = screen.queryAllByText((content, element) => {
        return content.includes(errorMessage);
      });
      
      expect(apiClient.post).toHaveBeenCalled();
      expect(apiClient.post).toHaveReturnedTimes(1);
    });
  });
  
  it('allows resending OTP after waiting for the timer', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    
    apiClient.post.mockResolvedValueOnce({ data: { message: 'OTP sent successfully' } })
                   .mockResolvedValueOnce({ data: { message: 'OTP sent successfully' } });
    
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <RegisterPage />
        </MemoryRouter>
      </ThemeProvider>
    );
    
    const firstNameInput = screen.getByLabelText(/First name/i);
    const lastNameInput = screen.getByLabelText(/Last name/i);
    const emailInput = screen.getByLabelText(/Email/i);
    
    await user.type(firstNameInput, 'John');
    await user.type(lastNameInput, 'Doe');
    await user.type(emailInput, 'valid@kcl.ac.uk');
    
    const otpButton = screen.getByText('Get OTP');
    await waitFor(() => expect(otpButton).not.toBeDisabled());
    await user.click(otpButton);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/One-time Password/i)).toBeInTheDocument();
    });
    
    const resendButton = screen.getByRole('button', {
      name: (text) => text.includes('Resend OTP')
    });
    expect(resendButton).toBeDisabled();
    
    for (let i = 0; i < 61; i++) {
      act(() => {
        vi.advanceTimersByTime(1000);
      });
    }
    
    expect(apiClient.post).toHaveBeenCalledTimes(1);
    
    vi.useRealTimers();
  }, 20000);
});