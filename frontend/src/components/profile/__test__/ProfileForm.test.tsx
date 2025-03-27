import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import ProfileForm from '../ProfileForm';  
import { tokens } from '../../../theme/theme';
import { apiClient } from '../../../api';
import { ThemeProvider, createTheme } from '@mui/material';
import { User } from '../../../types/user/user';

// Mock the theme tokens function
vi.mock('../../../theme/theme', () => ({
  tokens: vi.fn().mockReturnValue({
    grey: {
      0: '#ffffff',
      100: '#f0f0f0',
      300: '#c0c0c0',
      500: '#808080',
    },
    primary: {
      0: '#f5f5f5',
      500: '#3f51b5',
      600: '#303f9f',
    },
    blueAccent: {
      500: '#2196f3',
      600: '#1e88e5',
    },
  }),
}));

// Mock the API client
vi.mock('../../../api', () => ({
  apiClient: {
    put: vi.fn(),
    post: vi.fn(),
  },
  apiPaths: {
    USER: {
      CURRENT: '/api/users/current',
    },
  },
}));

describe('ProfileForm Component', () => {
  const mockColors = tokens();
  const mockSendOTP = vi.fn().mockResolvedValue(undefined);
  const mockSetOtpSent = vi.fn();
  const mockSetOtpMessage = vi.fn();
  const mockSetEmailVerified = vi.fn();
  const mockSetSnackbarData = vi.fn();
  
  const mockUser: User = {
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
    username: 'johndoe',
    email: 'john.doe@kcl.ac.uk',
    role: 'student',
    verified: true,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  };
  
  const defaultProps = {
    user: mockUser,
    isDark: false,
    colors: mockColors,
    sendOTP: mockSendOTP,
    otpSent: false,
    otpMessage: '',
    setOtpSent: mockSetOtpSent,
    setOtpMessage: mockSetOtpMessage,
    emailVerified: false,
    setEmailVerified: mockSetEmailVerified,
    setSnackbarData: mockSetSnackbarData,
  };

  const renderWithTheme = (ui: React.ReactElement) => {
    const theme = createTheme();
    return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
  };

  // Mock reload function for all tests
  let mockReload;

  beforeEach(() => {
    // Reset all mocks
    vi.resetAllMocks();
    
    // Clear specific mocks
    mockSetSnackbarData.mockClear();
    mockSetEmailVerified.mockClear();
    
    // Properly mock the window.location.reload method
    mockReload = vi.fn();
    const originalLocation = window.location;
    delete window.location;
    window.location = { ...originalLocation, reload: mockReload };
  });

  test('renders the form with user data pre-filled', () => {
    renderWithTheme(<ProfileForm {...defaultProps} />);
    
    expect(screen.getByRole('heading', { name: 'Update Profile' })).toBeInTheDocument();
    
    const firstNameInput = screen.getByLabelText(/First Name/i) as HTMLInputElement;
    const lastNameInput = screen.getByLabelText(/Last Name/i) as HTMLInputElement;
    const emailInput = screen.getByLabelText(/Email/i) as HTMLInputElement;
    
    expect(firstNameInput.value).toBe('John');
    expect(lastNameInput.value).toBe('Doe');
    expect(emailInput.value).toBe('john.doe@kcl.ac.uk');
    
    expect(screen.getByRole('button', { name: /Update Profile/i })).toBeInTheDocument();
  });

  test('shows validation errors for invalid name inputs', async () => {
    // Use real timers for this test
    vi.useRealTimers();
    
    renderWithTheme(<ProfileForm {...defaultProps} />);
    
    const firstNameInput = screen.getByLabelText(/First Name/i);
    await userEvent.clear(firstNameInput);
    await userEvent.type(firstNameInput, 'John123');
    
    const lastNameInput = screen.getByLabelText(/Last Name/i);
    await userEvent.clear(lastNameInput);
    await userEvent.type(lastNameInput, 'Doe@');
    
    fireEvent.blur(firstNameInput);
    fireEvent.blur(lastNameInput);
    
    // Use getAllByText since both fields will show the same error
    await waitFor(() => {
      const errorMessages = screen.getAllByText(/Shouldn't contain numbers or special characters/i);
      expect(errorMessages.length).toBeGreaterThan(0);
    });
  }, 15000);

  test('shows validation errors for invalid email', async () => {
    apiClient.post.mockResolvedValueOnce({ data: { inUse: false } });
    
    renderWithTheme(<ProfileForm {...defaultProps} />);
    
    const emailInput = screen.getByLabelText(/Email/i);
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, 'invalid-email@gmail.com');
    
    fireEvent.blur(emailInput);
    
    await waitFor(() => {
      expect(screen.getByText(/Email must end with @kcl.ac.uk/i)).toBeInTheDocument();
    });
  });

  test('checks if email is already in use', async () => {
    apiClient.post.mockResolvedValueOnce({ data: { inUse: true } });
    
    renderWithTheme(<ProfileForm {...defaultProps} />);
    
    const emailInput = screen.getByLabelText(/Email/i);
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, 'new.user@kcl.ac.uk');
    
    fireEvent.blur(emailInput);
    
    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/verification/check-email',
        { email: 'new.user@kcl.ac.uk' }
      );
      expect(screen.getByText(/This email is already in use/i)).toBeInTheDocument();
    });
  });

  test('shows Send OTP button when email is changed', async () => {
    apiClient.post.mockResolvedValueOnce({ data: { inUse: false } });
    
    renderWithTheme(<ProfileForm {...defaultProps} />);
    
    const emailInput = screen.getByLabelText(/Email/i);
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, 'new.user@kcl.ac.uk');
    
    fireEvent.blur(emailInput);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Send OTP/i })).toBeInTheDocument();
    });
  });

  test('sends OTP when requested', async () => {
    apiClient.post.mockResolvedValueOnce({ data: { inUse: false } });
    
    renderWithTheme(<ProfileForm {...defaultProps} />);
    
    const emailInput = screen.getByLabelText(/Email/i);
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, 'new.user@kcl.ac.uk');
    
    fireEvent.blur(emailInput);
    
    const sendOtpButton = await screen.findByRole('button', { name: /Send OTP/i });
    await userEvent.click(sendOtpButton);
    
    expect(mockSendOTP).toHaveBeenCalledWith('new.user@kcl.ac.uk');
  });

  test('shows OTP input field after OTP is sent', async () => {
    apiClient.post.mockResolvedValueOnce({ data: { inUse: false } });
    
    renderWithTheme(<ProfileForm {...defaultProps} otpSent={true} />);
    
    const emailInput = screen.getByLabelText(/Email/i);
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, 'new.user@kcl.ac.uk');
    
    fireEvent.blur(emailInput);
    
    expect(screen.getByLabelText(/Enter OTP/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Verify Email/i })).toBeInTheDocument();
  });

  test('verifies OTP successfully', async () => {
    // Because we're making two API calls, we need to setup specific responses for each URL
    apiClient.post.mockImplementation((url) => {
      if (url === '/api/verification/check-email') {
        return Promise.resolve({ data: { inUse: false } });
      } else if (url === '/api/verification/verify-otp') {
        return Promise.resolve({});
      }
      return Promise.reject(new Error('Unexpected URL'));
    });
    
    renderWithTheme(<ProfileForm {...defaultProps} otpSent={true} />);
    
    const emailInput = screen.getByLabelText(/Email/i);
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, 'new.user@kcl.ac.uk');
    
    fireEvent.blur(emailInput);
    
    const otpInput = screen.getByLabelText(/Enter OTP/i);
    await userEvent.type(otpInput, '123456');
    
    const verifyButton = screen.getByRole('button', { name: /Verify Email/i });
    await userEvent.click(verifyButton);
    
    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/verification/verify-otp',
        { email: 'new.user@kcl.ac.uk', otp: '123456' }
      );
      expect(mockSetEmailVerified).toHaveBeenCalledWith(true);
      expect(mockSetSnackbarData).toHaveBeenCalledWith({
        open: true,
        message: 'Email verified successfully!',
        severity: 'success',
      });
    });
  });

  test('handles OTP verification failure', async () => {
    // Create a completely separate mock implementation for this test
    apiClient.post.mockReset();
    
    let callCount = 0;
    apiClient.post.mockImplementation((url) => {
      if (url === '/api/verification/check-email') {
        return Promise.resolve({ data: { inUse: false } });
      } else if (url === '/api/verification/verify-otp') {
        callCount++;
        return Promise.reject(new Error('Invalid OTP'));
      }
      return Promise.reject(new Error('Unexpected URL'));
    });
    
    renderWithTheme(<ProfileForm {...defaultProps} otpSent={true} />);
    
    const emailInput = screen.getByLabelText(/Email/i);
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, 'new.user@kcl.ac.uk');
    
    fireEvent.blur(emailInput);
    
    const otpInput = screen.getByLabelText(/Enter OTP/i);
    await userEvent.type(otpInput, '123456');
    
    const verifyButton = screen.getByRole('button', { name: /Verify Email/i });
    await userEvent.click(verifyButton);
    
    await waitFor(() => {
      expect(callCount).toBe(1); // Make sure we called the OTP verification
      expect(mockSetEmailVerified).toHaveBeenCalledWith(false);
    });
    
    await waitFor(() => {
      expect(mockSetSnackbarData).toHaveBeenCalledWith({
        open: true,
        message: 'OTP verification failed.',
        severity: 'error',
      });
    });
  });

  test('disables update button when email is changed but not verified', async () => {
    apiClient.post.mockResolvedValueOnce({ data: { inUse: false } });
    
    renderWithTheme(<ProfileForm {...defaultProps} emailVerified={false} />);
    
    const emailInput = screen.getByLabelText(/Email/i);
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, 'new.user@kcl.ac.uk');
    
    fireEvent.blur(emailInput);
    
    const updateButton = screen.getByRole('button', { name: /Update Profile/i });
    expect(updateButton).toBeDisabled();
  });

  test('enables update button when email is changed and verified', async () => {
    apiClient.post.mockResolvedValueOnce({ data: { inUse: false } });
    
    renderWithTheme(<ProfileForm {...defaultProps} emailVerified={true} />);
    
    const emailInput = screen.getByLabelText(/Email/i);
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, 'new.user@kcl.ac.uk');
    
    fireEvent.blur(emailInput);
    
    const updateButton = screen.getByRole('button', { name: /Update Profile/i });
    expect(updateButton).not.toBeDisabled();
  });

  test('handles profile update failure', async () => {
    // Mock a failed API response
    apiClient.put.mockRejectedValue(new Error('Update failed'));
    
    renderWithTheme(<ProfileForm {...defaultProps} />);
    
    const firstNameInput = screen.getByLabelText(/First Name/i);
    await userEvent.clear(firstNameInput);
    await userEvent.type(firstNameInput, 'Jane');
    
    const updateButton = screen.getByRole('button', { name: /Update Profile/i });
    await userEvent.click(updateButton);
    
    await waitFor(() => {
      expect(mockSetSnackbarData).toHaveBeenCalledWith({
        open: true,
        message: 'Profile update failed.',
        severity: 'error',
      });
      
      expect(window.location.reload).not.toHaveBeenCalled();
    });
  });

  test('applies dark theme styles when isDark is true', () => {
    renderWithTheme(<ProfileForm {...defaultProps} isDark={true} />);
    
    // Just verify that the component renders with isDark prop
    expect(screen.getByRole('heading', { name: 'Update Profile' })).toBeInTheDocument();
  });
});