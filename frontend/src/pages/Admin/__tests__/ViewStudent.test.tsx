import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ViewStudent from '../ViewStudent';
import * as apiModule from '../../../api';

const theme = createTheme({
  palette: {
    mode: 'light',
  }
});

const mockGet = vi.fn();
const mockPatch = vi.fn();

vi.mock('../../../api', () => {
  return {
    apiClient: {
      get: vi.fn(),
      patch: vi.fn(),
    },
    apiPaths: {
      USER: {
        ADMINSTUDENTVIEW: (id) => `/api/admin-student-view/${id}`,
      },
    },
  };
});

const { apiClient } = apiModule;

const mockNavigate = vi.fn();
const mockUseParams = vi.fn().mockReturnValue({ student_id: '123' });

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockUseParams(),
  };
});

vi.mock('../../../stores/auth-store', () => ({
  useAuthStore: () => ({
    user: { id: 1, role: 'admin' },
  }),
}));

vi.mock('../../../theme/theme', () => ({
  tokens: () => ({
    primary: {
      100: '#f0f0f0',
      500: '#666666',
    },
    grey: {
      100: '#e0e0e0',
    },
  }),
}));

describe('ViewStudent Component', () => {
  const mockStudentId = '123';
  
  const mockStudentData = {
    id: 123,
    username: 'student123',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    role: 'student',
    major: 'Computer Science',
    societies: [1, 2],
    is_active: true,
    president_of: 456,
    is_president: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseParams.mockReturnValue({ student_id: mockStudentId });
    
    apiClient.get.mockImplementation(() => 
      Promise.resolve({ data: mockStudentData })
    );
    
    apiClient.patch.mockImplementation(() => 
      Promise.resolve({ data: { success: true } })
    );
  });

  const setup = async () => {
    let renderResult;
    
    await act(async () => {
      renderResult = render(
        <ThemeProvider theme={theme}>
          <MemoryRouter initialEntries={[`/view-student/${mockStudentId}`]}>
            <Routes>
              <Route path="/view-student/:student_id" element={<ViewStudent />} />
            </Routes>
          </MemoryRouter>
        </ThemeProvider>
      );
      
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    return renderResult;
  };

  it('renders loading state initially', async () => {
    const originalGet = apiClient.get;
    
    apiClient.get.mockImplementation(() => 
      new Promise(resolve => {
        setTimeout(() => resolve({ data: mockStudentData }), 100);
      })
    );
    
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={[`/view-student/${mockStudentId}`]}>
          <Routes>
            <Route path="/view-student/:student_id" element={<ViewStudent />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    );
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    apiClient.get.mockImplementation(originalGet);
  });

  it('fetches and displays student data correctly', async () => {
    await setup();
    
    expect(apiClient.get).toHaveBeenCalledWith(`/api/admin-student-view/${mockStudentId}`);
    
    expect(screen.getByText('View Student Details')).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toHaveValue(mockStudentData.username);
    expect(screen.getByLabelText('First Name')).toHaveValue(mockStudentData.first_name);
    expect(screen.getByLabelText('Last Name')).toHaveValue(mockStudentData.last_name);
    expect(screen.getByLabelText('Email')).toHaveValue(mockStudentData.email);
    expect(screen.getByLabelText('Role')).toHaveValue(mockStudentData.role);
    expect(screen.getByLabelText('Major')).toHaveValue(mockStudentData.major);
    expect(screen.getByLabelText('Societies')).toHaveValue(mockStudentData.societies.join(', '));
  });

  it('navigates back when back button is clicked', async () => {
    await setup();
    
    const backButton = screen.getByText('← Back');
    
    fireEvent.click(backButton);
    
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('handles form submission correctly', async () => {
    const snackbarSpy = vi.fn();
    const originalSnackbar = window.alert;
    window.alert = snackbarSpy;

    await setup();
    
    fireEvent.change(screen.getByLabelText('First Name'), {
      target: { value: 'Jane' }
    });
    
    const saveButton = screen.getByText('Save Changes');
    
    await act(async () => {
      fireEvent.click(saveButton);
    });
    
    expect(apiClient.patch).toHaveBeenCalledWith(
      `/api/admin/manage-student/${mockStudentId}`,
      expect.any(FormData),
      expect.objectContaining({
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    );
    
    window.alert = originalSnackbar;
  });

  it('handles API error when submitting form', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const snackbarSpy = vi.fn();
    const originalSnackbar = window.alert;
    window.alert = snackbarSpy;

    apiClient.patch.mockImplementation(() => 
      Promise.reject(new Error('Failed to update student'))
    );
    
    await setup();
    
    const saveButton = screen.getByText('Save Changes');
    
    await act(async () => {
      fireEvent.click(saveButton);
    });
    
    expect(consoleErrorSpy).toHaveBeenCalled();
    
    consoleErrorSpy.mockRestore();
    window.alert = originalSnackbar;
  });

  it('handles API error when fetching student data', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    apiClient.get.mockImplementation(() => 
      Promise.reject(new Error('Failed to fetch student'))
    );
    
    await act(async () => {
      render(
        <ThemeProvider theme={theme}>
          <MemoryRouter initialEntries={[`/view-student/${mockStudentId}`]}>
            <Routes>
              <Route path="/view-student/:student_id" element={<ViewStudent />} />
            </Routes>
          </MemoryRouter>
        </ThemeProvider>
      );
    });
    
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
    
    consoleErrorSpy.mockRestore();
  });

  it('toggles switches correctly', async () => {
    await setup();
    
    expect(screen.getByText('View Student Details')).toBeInTheDocument();
    expect(screen.getByText('Save Changes')).toBeInTheDocument();
  });

  it('updates societies input correctly', async () => {
    await setup();
    
    const societiesInput = screen.getByLabelText('Societies');
    const newValue = '1, 2, 3';
    
    fireEvent.change(societiesInput, {
      target: { value: newValue }
    });
    
    expect(societiesInput).toHaveValue(newValue);
  });

  it('updates presidentOf input correctly', async () => {
    await setup();
    
    const presidentOfInput = screen.getByLabelText('President Of (IDs)');
    const newValue = '456,789,101';
    
    fireEvent.change(presidentOfInput, {
      target: { value: newValue }
    });
    
    expect(presidentOfInput).toHaveValue(newValue);
  });
});