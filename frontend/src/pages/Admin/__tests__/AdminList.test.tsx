import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import AdminList from '../AdminList';
import { apiClient, apiPaths } from '../../../api';
import { SearchContext } from '../../../components/layout/SearchContext';

const theme = createTheme({
  palette: {
    mode: 'light',
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

// Mock the apiClient and apiPaths
vi.mock('../../../api', () => {
  return {
    apiClient: {
      get: vi.fn(),
      request: vi.fn(),
      delete: vi.fn(),
    },
    apiPaths: {
      USER: {
        ADMIN: '/api/users/admin',
        CURRENT: '/api/users/current',
        DELETE: vi.fn().mockImplementation((userType, id) => `/api/users/${userType.toLowerCase()}/${id}`),
      }
    }
  };
});

// Mock the navigate function
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock the settings store
vi.mock('../../../stores/settings-store', () => ({
  useSettingsStore: vi.fn().mockReturnValue({
    drawer: false,
  }),
}));

// For capturing different user permission levels
let currentUserIsSuperAdmin = true;

// Mock the auth store
vi.mock('../../../stores/auth-store', () => {
  const mockSetUser = vi.fn();
  return {
    useAuthStore: vi.fn().mockImplementation(() => ({
      user: { is_super_admin: currentUserIsSuperAdmin },
      setUser: mockSetUser,
    })),
  };
});

// Mock the tokens function
vi.mock('../../../theme/theme', () => ({
  tokens: vi.fn().mockReturnValue({
    grey: { 100: '#ffffff' },
    primary: { 400: '#f5f5f5' },
    blueAccent: { 400: '#2196f3', 500: '#1976d2', 700: '#1565c0' },
  }),
}));

// Mock window.alert
global.alert = vi.fn();

describe('AdminList Component', () => {
  const mockAdmins = [
    {
      id: 1,
      username: 'admin1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      is_active: true,
      role: 'admin',
      is_super_admin: false
    },
    {
      id: 2,
      username: 'admin2',
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane.smith@example.com',
      is_active: true,
      role: 'admin',
      is_super_admin: true
    },
    {
      id: 3,
      username: 'user1',
      first_name: 'Bob',
      last_name: 'Johnson',
      email: 'bob.johnson@example.com',
      is_active: true,
      role: 'user', // This one should be filtered out
      is_super_admin: false
    },
  ];

  const mockCurrentUser = {
    id: 1,
    username: 'admin1',
    first_name: 'John',
    last_name: 'Doe',
    is_active: true,
    role: 'admin',
    is_super_admin: true
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mock responses
    apiClient.get.mockImplementation((url) => {
      if (url === apiPaths.USER.ADMIN) {
        return Promise.resolve({ data: mockAdmins });
      } else if (url === apiPaths.USER.CURRENT) {
        return Promise.resolve({ data: mockCurrentUser });
      }
      return Promise.reject(new Error('Unexpected URL'));
    });
    
    apiClient.request.mockResolvedValue({ data: { success: true } });
  });

  const defaultSearchContext = {
    searchTerm: '',
    setSearchTerm: vi.fn(),
  };

  const setup = async (searchTerm = '', useDarkTheme = false, isUserSuperAdmin = true) => {
    // Set the permission level for this test
    currentUserIsSuperAdmin = isUserSuperAdmin;
    
    const searchContext = {
      ...defaultSearchContext,
      searchTerm,
    };

    let renderResult;
    
    await act(async () => {
      renderResult = render(
        <ThemeProvider theme={useDarkTheme ? darkTheme : theme}>
          <SearchContext.Provider value={searchContext}>
            <MemoryRouter initialEntries={['/admin/admins']}>
              <Routes>
                <Route path="/admin/admins" element={<AdminList />} />
              </Routes>
            </MemoryRouter>
          </SearchContext.Provider>
        </ThemeProvider>
      );
      
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    return renderResult;
  };

  it('renders loading state initially', async () => {
    const originalGet = apiClient.get;
    
    apiClient.get.mockImplementation((url) => {
      if (url === apiPaths.USER.ADMIN || url === apiPaths.USER.CURRENT) {
        return new Promise(resolve => {
          setTimeout(() => resolve({ 
            data: url === apiPaths.USER.ADMIN ? mockAdmins : mockCurrentUser 
          }), 1000);
        });
      }
      return Promise.reject(new Error('Unexpected URL'));
    });
    
    await act(async () => {
      render(
        <ThemeProvider theme={theme}>
          <SearchContext.Provider value={defaultSearchContext}>
            <MemoryRouter initialEntries={['/admin/admins']}>
              <AdminList />
            </MemoryRouter>
          </SearchContext.Provider>
        </ThemeProvider>
      );
    });
    
    // Wait for the component to render
    expect(screen.getByText('Admin List')).toBeInTheDocument();
    
    apiClient.get.mockImplementation(originalGet);
  });

  it('fetches and displays admins correctly', async () => {
    await setup();
    
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith(apiPaths.USER.ADMIN);
      expect(apiClient.get).toHaveBeenCalledWith(apiPaths.USER.CURRENT);
    });
    
    expect(screen.getByText('Admin List')).toBeInTheDocument();
    
    // Only admin roles should be displayed (2 out of 3)
    expect(screen.getByText('admin1')).toBeInTheDocument();
    expect(screen.getByText('admin2')).toBeInTheDocument();
    expect(screen.queryByText('user1')).not.toBeInTheDocument();
    
    // Check for other details
    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('Doe')).toBeInTheDocument();
    expect(screen.getByText('jane.smith@example.com')).toBeInTheDocument();
  });

  it('filters admins based on search term', async () => {
    await setup('Jane');
    
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith(apiPaths.USER.ADMIN);
    });
    
    // Only Jane should be visible
    expect(screen.getByText('Jane')).toBeInTheDocument();
    expect(screen.queryByText('John')).not.toBeInTheDocument();
  });

  it('navigates to view admin page when View button is clicked', async () => {
    await setup();
    
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith(apiPaths.USER.ADMIN);
    });
    
    const viewButtons = screen.getAllByText('View');
    
    await act(async () => {
      fireEvent.click(viewButtons[0]);
    });
    
    expect(mockNavigate).toHaveBeenCalledWith('/admin/view-admin/1');
  });

  it('opens delete dialog when Delete button is clicked', async () => {
    await setup();
    
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith(apiPaths.USER.ADMIN);
    });
    
    const deleteButtons = screen.getAllByText('Delete');
    
    await act(async () => {
      fireEvent.click(deleteButtons[0]);
    });
    
    expect(screen.getByText(/Please confirm that you would like to delete/)).toBeInTheDocument();
    expect(screen.getByText(/You may undo this action in the Activity Log/)).toBeInTheDocument();
    // Changed selector from getByLabelText to getByRole('textbox')
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('handles delete confirmation correctly', async () => {
    await setup();
    
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith(apiPaths.USER.ADMIN);
    });
    
    const deleteButtons = screen.getAllByText('Delete');
    
    await act(async () => {
      fireEvent.click(deleteButtons[0]);
    });
    
    // Changed selector from getByLabelText to getByRole('textbox')
    const reasonInput = screen.getByRole('textbox');
    await act(async () => {
      fireEvent.change(reasonInput, { target: { value: 'No longer needed' } });
    });
    
    const confirmButton = screen.getByText('Confirm');
    await act(async () => {
      fireEvent.click(confirmButton);
    });
    
    expect(apiClient.request).toHaveBeenCalledWith({
      method: 'DELETE',
      url: '/api/users/admin/1',
      data: { reason: 'No longer needed' },
    });
  });

  it('handles API error when deleting admin', async () => {
    await setup();
    
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith(apiPaths.USER.ADMIN);
    });
    
    // We need to ensure the error occurs when clicking confirm,
    // so we'll mock the request to fail
    apiClient.request.mockRejectedValueOnce({
      response: {
        data: {
          error: 'Failed to delete admin'
        }
      }
    });
    
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const deleteButtons = screen.getAllByText('Delete');
    
    await act(async () => {
      fireEvent.click(deleteButtons[0]);
    });
    
    // Enter a reason and click confirm using getByRole('textbox')
    const reasonInput = screen.getByRole('textbox');
    await act(async () => {
      fireEvent.change(reasonInput, { target: { value: 'Test reason' } });
    });
    
    const confirmButton = screen.getByText('Confirm');
    
    // We need to ensure the error is actually triggered
    await act(async () => {
      fireEvent.click(confirmButton);
      // Wait for the promise to reject
      await new Promise(process.nextTick);
    });
    
    // Now verify the console.error was called
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(global.alert).toHaveBeenCalledWith('Error: Failed to delete admin');
    
    consoleErrorSpy.mockRestore();
  });

  it('renders correctly in dark theme', async () => {
    await setup('', true);

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith(apiPaths.USER.ADMIN);
    });

    expect(screen.getByText('Admin List')).toBeInTheDocument();
  });

  it('does not show Delete button for non-super admin users', async () => {
    // Test with super admin set to false
    await setup('', false, false);
    
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith(apiPaths.USER.ADMIN);
    });
    
    // There should only be View buttons, no Delete buttons
    expect(screen.getAllByText('View').length).toBeGreaterThan(0);
    expect(screen.queryAllByText('Delete').length).toBe(0);
  });

  it('handles empty admin list correctly', async () => {
    apiClient.get.mockImplementation((url) => {
      if (url === apiPaths.USER.ADMIN) {
        return Promise.resolve({ data: [] });
      } else if (url === apiPaths.USER.CURRENT) {
        return Promise.resolve({ data: mockCurrentUser });
      }
      return Promise.reject(new Error('Unexpected URL'));
    });

    await setup();
    
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith(apiPaths.USER.ADMIN);
    });
    
    // Check for empty data grid (no specific text but the component should render)
    expect(screen.getByText('Admin List')).toBeInTheDocument();
  });
});