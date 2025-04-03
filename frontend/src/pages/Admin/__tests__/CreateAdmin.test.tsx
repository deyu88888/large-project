import { vi } from 'vitest';

// Mock MUI components to avoid importing all the actual modules
vi.mock('@mui/material', () => {
  return {
    Box: ({ children, ...props }) => <div data-testid="mui-box" {...props}>{children}</div>,
    Button: ({ children, onClick, disabled, type, ...props }) => (
      <button onClick={onClick} disabled={disabled} type={type} {...props}>{children}</button>
    ),
    IconButton: ({ children, onClick, ...props }) => (
      <button onClick={onClick} {...props}>{children}</button>
    ),
    InputAdornment: ({ children, position, ...props }) => (
      <div data-testid="input-adornment" data-position={position} {...props}>{children}</div>
    ),
    TextField: ({ label, name, value, onChange, onBlur, type, error, helperText, disabled, InputProps, ...props }) => (
      <div data-testid={`text-field-${name}`} {...props}>
        <label htmlFor={name}>{label}</label>
        <input
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          type={type || "text"}
          disabled={disabled}
          aria-label={label}
          data-error={error ? 'true' : 'false'}
        />
        {error && helperText && <p>{helperText}</p>}
        {InputProps?.endAdornment}
      </div>
    ),
    Paper: ({ children, ...props }) => <div data-testid="mui-paper" {...props}>{children}</div>,
    Typography: ({ children, variant, ...props }) => (
      <p data-variant={variant} {...props}>{children}</p>
    ),
    Alert: ({ children, severity, onClose, ...props }) => (
      <div data-testid="mui-alert" data-severity={severity} {...props}>
        {children}
        {onClose && <button onClick={onClose}>Close</button>}
      </div>
    ),
    Snackbar: ({ children, open, onClose, ...props }) => (
      open ? <div data-testid="mui-snackbar" {...props}>
        {children}
        {onClose && <button onClick={onClose}>Close</button>}
      </div> : null
    ),
    useTheme: () => ({
      palette: {
        mode: 'light',
      },
    }),
    createTheme: () => ({}),
    ThemeProvider: ({ children }) => <div data-testid="theme-provider">{children}</div>,
    useMediaQuery: () => true,
  };
});

// Mock MUI icons
vi.mock('@mui/icons-material', () => ({
  Visibility: () => <span data-testid="icon-visibility">Visibility</span>,
  VisibilityOff: () => <span data-testid="icon-visibility-off">VisibilityOff</span>,
}));

// Mock Formik
vi.mock('formik', () => ({
  Formik: ({ children, initialValues, onSubmit }) => {
    const formikProps = {
      values: initialValues,
      errors: {},
      touched: {},
      handleSubmit: (e) => {
        e?.preventDefault();
        onSubmit(initialValues, { resetForm: () => {} });
      },
      handleChange: () => {},
      handleBlur: () => {},
      isValid: true,
      dirty: true,
    };
    return typeof children === 'function' ? children(formikProps) : children;
  },
  Form: ({ children, onSubmit }) => <form onSubmit={onSubmit}>{children}</form>,
}));

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

vi.mock('../../../components/loading/CircularLoader', () => ({
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
        aria-label={label}
        data-error={error ? 'true' : 'false'}
      />
      {error && helperText && <p>{helperText}</p>}
    </div>
  ),
}));

// Mock yup with chainable methods
vi.mock('yup', () => {
  // Create a chainable mock that returns itself for any method
  const createChainableMock = () => {
    const mock = {};
    const handler = {
      get: (target, prop) => {
        if (prop === 'then' || prop === 'catch' || prop === 'finally') {
          return undefined; // Handle promise-like behavior
        }
        
        return (...args) => {
          return new Proxy(mock, handler);
        };
      }
    };
    return new Proxy(mock, handler);
  };

  const chainableMock = createChainableMock();
  
  return {
    object: () => chainableMock,
    string: () => chainableMock,
    ref: () => 'mockRef',
  };
});

// Mock for tokens
vi.mock('../../../theme/theme', () => ({
  tokens: () => ({
    primary: {
      400: '#888888'
    }
  })
}));

// Regular imports after all mocks
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateAdmin from '../CreateAdmin';
import { apiClient } from '../../../api';
import { useAuthStore } from '../../../stores/auth-store';
import { useSettingsStore } from '../../../stores/settings-store';

// Helper function to find form elements by name
const getInputByName = (container, name) => {
  return container.querySelector(`input[name="${name}"]`);
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
    render(<CreateAdmin />);
    
    // Verify the header is rendered with correct texts
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByText('Create Admin')).toBeInTheDocument();
    expect(screen.getByText('Create a New Admin Profile')).toBeInTheDocument();
  });

  it('should show unauthorized view when user is not a super admin', () => {
    // Mock user without super admin privileges
    useAuthStore.mockReturnValue({
      user: {
        is_super_admin: false,
        username: 'regularadmin',
      },
    });
    
    render(<CreateAdmin />);
    
    // Verify unauthorized view is shown
    expect(screen.getByText('You are not authorized to create an admin')).toBeInTheDocument();
    expect(screen.getByText('This feature is restricted to super administrators only.')).toBeInTheDocument();
  });

  it('should submit form when submit button is clicked', async () => {
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
    
    render(<CreateAdmin />);
    
    // Find and click the submit button
    const submitButton = screen.getByRole('button', { name: /create new admin/i });
    fireEvent.click(submitButton);
    
    // Verify API was called
    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalled();
    });
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
    
    render(<CreateAdmin />);
    
    // Find and click the submit button
    const submitButton = screen.getByRole('button', { name: /create new admin/i });
    fireEvent.click(submitButton);
    
    // Wait for the API call to resolve
    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalled();
    });
  });

  it('should have a reset button', () => {
    render(<CreateAdmin />);
    
    // Verify reset button exists
    const resetButton = screen.getByRole('button', { name: /reset/i });
    expect(resetButton).toBeInTheDocument();
  });
});