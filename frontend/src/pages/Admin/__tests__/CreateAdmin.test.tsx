import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material';
import CreateAdmin from '../CreateAdmin';
import { apiClient } from '../../../api';
import { useAuthStore } from '../../../stores/auth-store';
import { useSettingsStore } from '../../../stores/settings-store';

// Mock the dependencies
vi.mock('../../../api', () => ({
  apiClient: {
    post: vi.fn(),
  },
  apiPaths: {
    USER: {
      ADMIN: '/users/admin',
    },
  },
}));

vi.mock('../../../stores/auth-store', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('../../../stores/settings-store', () => ({
  useSettingsStore: vi.fn(),
}));

vi.mock('../../../components/Header', () => ({
  default: ({ title, subtitle }) => (
    <div data-testid="header">
      <h1>{title}</h1>
      <h2>{subtitle}</h2>
    </div>
  ),
}));

vi.mock('../../../components/loading/circular-loader', () => ({
  default: ({ size }) => <div data-testid="circular-loader" style={{ width: size, height: size }}>Loading...</div>,
}));

vi.mock('../../../components/TextFieldComponent', () => ({
  default: ({ label, name, value, handleBlur, handleChange, error, helperText, disabled, gridSpan }) => (
    <div data-testid={`text-field-${name}`} style={{ gridColumn: gridSpan }}>
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        data-error={error ? 'true' : 'false'}
      />
      {error && helperText && <p>{helperText}</p>}
    </div>
  ),
}));

// Create a theme for testing
const theme = createTheme({
  palette: {
    mode: 'light',
  },
});

const renderComponent = () => {
  return render(
    <ThemeProvider theme={theme}>
      <CreateAdmin />
    </ThemeProvider>
  );
};

describe('CreateAdmin Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    
    // Mock the auth store with a super admin user by default
    useAuthStore.mockReturnValue({
      user: {
        is_super_admin: true,
        username: 'testadmin',
      },
    });
    
    // Mock the settings store
    useSettingsStore.mockReturnValue({
      drawer: false,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render the form when user is a super admin', () => {
    renderComponent();
    
    // Verify the header is rendered with correct texts
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByText('Create Admin')).toBeInTheDocument();
    expect(screen.getByText('Create a New Admin Profile')).toBeInTheDocument();
    
    // Verify form fields are rendered
    expect(screen.getByTestId('text-field-first_name')).toBeInTheDocument();
    expect(screen.getByTestId('text-field-last_name')).toBeInTheDocument();
    expect(screen.getByTestId('text-field-username')).toBeInTheDocument();
    expect(screen.getByTestId('text-field-email')).toBeInTheDocument();
    
    // Verify password fields
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    
    // Verify buttons
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create new admin/i })).toBeInTheDocument();
  });

  it('should show unauthorized view when user is not a super admin', () => {
    // Mock user without super admin privileges
    useAuthStore.mockReturnValue({
      user: {
        is_super_admin: false,
        username: 'regularadmin',
      },
    });
    
    renderComponent();
    
    // Verify unauthorized view is shown
    expect(screen.getByText('You are not authorized to create an admin')).toBeInTheDocument();
    expect(screen.getByText('This feature is restricted to super administrators only.')).toBeInTheDocument();
  });

  it('should validate form fields and disable submit button when invalid', async () => {
    renderComponent();
    
    // Get submit button
    const submitButton = screen.getByRole('button', { name: /create new admin/i });
    
    // Initially the button should be disabled because the form is pristine
    expect(submitButton).toBeDisabled();
    
    // Fill out form with invalid data
    await userEvent.type(screen.getByLabelText('First Name'), 'John');
    await userEvent.type(screen.getByLabelText('Last Name'), 'Doe');
    await userEvent.type(screen.getByLabelText('Username'), 'jd'); // too short
    await userEvent.type(screen.getByLabelText('Email'), 'john.doe@example.com'); // not a kcl.ac.uk email
    // Use more specific selectors for password fields
    // Find input fields by name attribute
    const passwordField = getInputByName(document.body, 'password');
    const confirmPasswordField = getInputByName(document.body, 'confirmPassword');
    
    if (!passwordField || !confirmPasswordField) {
      throw new Error('Password or confirm password field not found');
    }
    
    await userEvent.type(passwordField, 'pass'); // too short
    await userEvent.type(confirmPasswordField, 'password'); // doesn't match

    // Trigger validation by blurring fields
    fireEvent.blur(screen.getByLabelText('Username'));
    fireEvent.blur(screen.getByLabelText('Email'));
    fireEvent.blur(screen.getByLabelText('Password'));
    fireEvent.blur(screen.getByLabelText('Confirm Password'));
    
    // Submit button should still be disabled because form is invalid
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
  });

  it('should submit form successfully when all fields are valid', async () => {
    // Mock successful API response
    apiClient.post.mockResolvedValueOnce({
      data: {
        admin: {
          id: '1',
          first_name: 'John',
          last_name: 'Doe',
          username: 'johndoe',
          email: 'john.doe@kcl.ac.uk',
        },
      },
    });
    
    renderComponent();
    
    // Fill out form with valid data
    await userEvent.type(screen.getByLabelText('First Name'), 'John');
    await userEvent.type(screen.getByLabelText('Last Name'), 'Doe');
    await userEvent.type(screen.getByLabelText('Username'), 'johndoe');
    await userEvent.type(screen.getByLabelText('Email'), 'john.doe@kcl.ac.uk');
    // Use more specific selectors for password fields
    // Find input fields by name attribute
    const passwordField = getInputByName(document.body, 'password');
    const confirmPasswordField = getInputByName(document.body, 'confirmPassword');
    
    if (!passwordField || !confirmPasswordField) {
      throw new Error('Password or confirm password field not found');
    }
    
    await userEvent.type(passwordField, 'password123');
    await userEvent.type(confirmPasswordField, 'password123');
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /create new admin/i });
    
    // Wait for the button to become enabled
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
    
    // Click the submit button
    await userEvent.click(submitButton);
    
    // Verify API was called with correct data
    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/users/admin', {
        first_name: 'John',
        last_name: 'Doe',
        username: 'johndoe',
        email: 'john.doe@kcl.ac.uk',
        password: 'password123',
        confirmPassword: 'password123',
      });
    });
    
    // Verify success view is displayed
    await waitFor(() => {
      expect(screen.getByText('New Admin Created Successfully!')).toBeInTheDocument();
    });
    
    // Verify admin info is displayed
    expect(screen.getByText('First Name: John')).toBeInTheDocument();
    expect(screen.getByText('Last Name: Doe')).toBeInTheDocument();
    expect(screen.getByText('Username: johndoe')).toBeInTheDocument();
    expect(screen.getByText('Email: john.doe@kcl.ac.uk')).toBeInTheDocument();
    
    // Verify "Create Another Admin" button is displayed
    expect(screen.getByRole('button', { name: /create another admin/i })).toBeInTheDocument();
  });

  it('should handle API errors when creating admin', async () => {
    // Mock API error
    apiClient.post.mockRejectedValueOnce({
      response: {
        data: {
          message: 'Username already exists',
        },
      },
    });
    
    renderComponent();
    
    // Fill out form with valid data
    await userEvent.type(screen.getByLabelText('First Name'), 'John');
    await userEvent.type(screen.getByLabelText('Last Name'), 'Doe');
    await userEvent.type(screen.getByLabelText('Username'), 'johndoe');
    await userEvent.type(screen.getByLabelText('Email'), 'john.doe@kcl.ac.uk');
    
    // Find input fields by name attribute
    const passwordField = getInputByName(document.body, 'password');
    const confirmPasswordField = getInputByName(document.body, 'confirmPassword');
    
    if (!passwordField || !confirmPasswordField) {
      throw new Error('Password or confirm password field not found');
    }
    
    await userEvent.type(passwordField, 'password123');
    await userEvent.type(confirmPasswordField, 'password123');
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /create new admin/i });
    
    // Wait for the button to become enabled
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
    
    // Click the submit button
    await userEvent.click(submitButton);
    
    // Verify error is displayed
    await waitFor(() => {
      expect(screen.getByText('Username already exists')).toBeInTheDocument();
    });
    
    // Verify form is still displayed
    expect(screen.getByLabelText('First Name')).toBeInTheDocument();
  });

  it('should reset form when reset button is clicked', async () => {
    renderComponent();
    
    // Fill out form fields
    await userEvent.type(screen.getByLabelText('First Name'), 'John');
    await userEvent.type(screen.getByLabelText('Last Name'), 'Doe');
    
    // Click reset button
    const resetButton = screen.getByRole('button', { name: /reset/i });
    await userEvent.click(resetButton);
    
    // Verify fields are reset
    expect(screen.getByLabelText('First Name')).toHaveValue('');
    expect(screen.getByLabelText('Last Name')).toHaveValue('');
  });

  it('should toggle password visibility when toggle button is clicked', async () => {
    renderComponent();
    
    // Find password input by name attribute
    const passwordField = getInputByName(document.body, 'password');
    
    if (!passwordField) {
      throw new Error('Password field not found');
    }
    
    expect(passwordField).toHaveAttribute('type', 'password');
    
    // Find and click the toggle visibility button
    const toggleButtons = screen.getAllByRole('button', { name: /show password/i });
    
    // Click the first toggle button (for the password field)
    await userEvent.click(toggleButtons[0]);
    
    // After clicking, password fields should be of type "text"
    await waitFor(() => {
      expect(passwordField).toHaveAttribute('type', 'text');
    });
    
    // Click again to hide
    await userEvent.click(toggleButtons[0]);
    
    // Should go back to password type
    await waitFor(() => {
      expect(passwordField).toHaveAttribute('type', 'password');
    });
  });

  it('should return to form when "Create Another Admin" is clicked in success view', async () => {
    // Mock successful API response
    apiClient.post.mockResolvedValueOnce({
      data: {
        admin: {
          id: '1',
          first_name: 'John',
          last_name: 'Doe',
          username: 'johndoe',
          email: 'john.doe@kcl.ac.uk',
        },
      },
    });
    
    renderComponent();
    
    // Fill out and submit form
    await userEvent.type(screen.getByLabelText('First Name'), 'John');
    await userEvent.type(screen.getByLabelText('Last Name'), 'Doe');
    await userEvent.type(screen.getByLabelText('Username'), 'johndoe');
    await userEvent.type(screen.getByLabelText('Email'), 'john.doe@kcl.ac.uk');
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.type(screen.getByLabelText('Confirm Password'), 'password123');
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /create new admin/i });
    
    // Wait for the button to become enabled
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
    
    await userEvent.click(submitButton);
    
    // Wait for success view
    await waitFor(() => {
      expect(screen.getByText('New Admin Created Successfully!')).toBeInTheDocument();
    });
    
    // Click "Create Another Admin" button
    const createAnotherButton = screen.getByRole('button', { name: /create another admin/i });
    await userEvent.click(createAnotherButton);
    
    // Verify we're back to the form view
    await waitFor(() => {
      expect(screen.getByText('Create a New Admin Profile')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create new admin/i })).toBeInTheDocument();
    });
  });
});