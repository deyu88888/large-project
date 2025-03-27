import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import PasswordForm from '../PasswordForm';  
import { tokens } from '../../../theme/theme';
import { apiClient } from '../../../api';
import { ThemeProvider, createTheme } from '@mui/material';

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
  },
}));

describe('PasswordForm Component', () => {
  const mockColors = tokens();
  const mockSetSnackbarData = vi.fn();
  
  const defaultProps = {
    isDark: false,
    colors: mockColors,
    setSnackbarData: mockSetSnackbarData,
  };

  const renderWithTheme = (ui: React.ReactElement) => {
    const theme = createTheme();
    return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders the form with all fields', () => {
    renderWithTheme(<PasswordForm {...defaultProps} />);
    
    // Using heading role to find the title
    expect(screen.getByRole('heading', { name: 'Update Password' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Current Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/New Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Update Password/i })).toBeInTheDocument();
  });

  test('shows validation errors when submitting empty form', async () => {
    renderWithTheme(<PasswordForm {...defaultProps} />);
    
    const submitButton = screen.getByRole('button', { name: /Update Password/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Must enter current password/i)).toBeInTheDocument();
      expect(screen.getByText(/Must enter new password/i)).toBeInTheDocument();
      expect(screen.getByText(/Please confirm new password/i)).toBeInTheDocument();
    });
  });

  test('shows validation error when new password is too short', async () => {
    renderWithTheme(<PasswordForm {...defaultProps} />);
    
    const currentPasswordField = screen.getByLabelText(/Current Password/i);
    const newPasswordField = screen.getByLabelText(/New Password/i);
    
    await userEvent.type(currentPasswordField, 'currentpass');
    await userEvent.type(newPasswordField, 'short');
    
    const submitButton = screen.getByRole('button', { name: /Update Password/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/New password must be at least 8 characters/i)).toBeInTheDocument();
    });
  });

  test('shows validation error when passwords do not match', async () => {
    renderWithTheme(<PasswordForm {...defaultProps} />);
    
    const currentPasswordField = screen.getByLabelText(/Current Password/i);
    const newPasswordField = screen.getByLabelText(/New Password/i);
    const confirmPasswordField = screen.getByLabelText(/Confirm Password/i);
    
    await userEvent.type(currentPasswordField, 'currentpass');
    await userEvent.type(newPasswordField, 'newpassword123');
    await userEvent.type(confirmPasswordField, 'differentpass123');
    
    const submitButton = screen.getByRole('button', { name: /Update Password/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
    });
  });

  test('toggles password visibility when clicking the eye icons', async () => {
    renderWithTheme(<PasswordForm {...defaultProps} />);
    
    // Check initial state (passwords should be hidden)
    const currentPasswordField = screen.getByLabelText(/Current Password/i);
    expect(currentPasswordField).toHaveAttribute('type', 'password');
    
    // Click visibility toggle for current password
    const visibilityButtons = screen.getAllByRole('button', { name: '' });  
    fireEvent.click(visibilityButtons[0]);
    
    // Password should now be visible
    expect(currentPasswordField).toHaveAttribute('type', 'text');
    
    // Click again to hide
    fireEvent.click(visibilityButtons[0]);
    expect(currentPasswordField).toHaveAttribute('type', 'password');
  });

  test('submits form with valid data and shows success message', async () => {
    // Mock successful API response
    (apiClient.put as any).mockResolvedValueOnce({});
    
    renderWithTheme(<PasswordForm {...defaultProps} />);
    
    // Fill out the form
    const currentPasswordField = screen.getByLabelText(/Current Password/i);
    const newPasswordField = screen.getByLabelText(/New Password/i);
    const confirmPasswordField = screen.getByLabelText(/Confirm Password/i);
    
    await userEvent.type(currentPasswordField, 'currentpass');
    await userEvent.type(newPasswordField, 'newpassword123');
    await userEvent.type(confirmPasswordField, 'newpassword123');
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /Update Password/i });
    fireEvent.click(submitButton);
    
    // Wait for the form submission to complete
    await waitFor(() => {
      // Check that API was called with correct data
      expect(apiClient.put).toHaveBeenCalledWith('api/users/password', {
        current_password: 'currentpass',
        new_password: 'newpassword123',
        confirm_password: 'newpassword123',
      });
      
      // Check that success message was triggered
      expect(mockSetSnackbarData).toHaveBeenCalledWith({
        open: true,
        message: 'Password updated successfully!',
        severity: 'success',
      });
    });
  });

  test('handles API error and shows error message', async () => {
    // Mock API failure
    (apiClient.put as any).mockRejectedValueOnce(new Error('API Error'));
    
    renderWithTheme(<PasswordForm {...defaultProps} />);
    
    // Fill out the form
    const currentPasswordField = screen.getByLabelText(/Current Password/i);
    const newPasswordField = screen.getByLabelText(/New Password/i);
    const confirmPasswordField = screen.getByLabelText(/Confirm Password/i);
    
    await userEvent.type(currentPasswordField, 'currentpass');
    await userEvent.type(newPasswordField, 'newpassword123');
    await userEvent.type(confirmPasswordField, 'newpassword123');
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /Update Password/i });
    fireEvent.click(submitButton);
    
    // Wait for the form submission to complete
    await waitFor(() => {
      // Check that error message was triggered
      expect(mockSetSnackbarData).toHaveBeenCalledWith({
        open: true,
        message: 'Failed to update password.',
        severity: 'error',
      });
    });
  });

  test('applies dark theme styles when isDark is true', () => {
    const darkThemeProps = {
      ...defaultProps,
      isDark: true,
    };
    
    renderWithTheme(<PasswordForm {...darkThemeProps} />);
    
    // Use more specific queries to avoid conflicts with multiple elements containing "Update Password"
    expect(screen.getByRole('heading', { name: 'Update Password' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Current Password/i)).toBeInTheDocument();
  });
});