import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import StudentList from '../StudentList';
import { SearchContext } from '../../../components/layout/SearchContext';
import { apiClient, apiPaths } from '../../../api';

const theme = createTheme({
  palette: {
    mode: 'light',
  }
});

vi.mock('../../../stores/settings-store', () => ({
  useSettingsStore: () => ({
    drawer: false,
  }),
}));

vi.mock('../../../api', () => {
  const apiClientMock = {
    get: vi.fn(),
    request: vi.fn()
  };
  
  return {
    apiClient: apiClientMock,
    apiPaths: {
      USER: {
        STUDENTS: '/api/students',
        DELETE: vi.fn().mockImplementation((role, id) => `/api/users/${role}/${id}/delete`),
      },
    },
  };
});

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../../theme/theme', () => ({
  tokens: () => ({
    grey: {
      100: '#e0e0e0',
    },
    primary: {
      400: '#f5f5f5',
    },
    blueAccent: {
      400: '#2196f3',
      500: '#1976d2',
      700: '#0d47a1',
    },
  }),
}));

describe('StudentList Component', () => {
  const mockStudents = [
    {
      id: '1',
      username: 'jsmith',
      first_name: 'John',
      last_name: 'Smith',
      email: 'john.smith@example.com',
      is_active: true,
      role: 'Student',
      major: 'Computer Science',
      societies: ['Coding Club', 'Math Society'],
      president_of: ['Coding Club'],
      is_president: true,
    },
    {
      id: '2',
      username: 'mjohnson',
      first_name: 'Mary',
      last_name: 'Johnson',
      email: 'mary.johnson@example.com',
      is_active: false,
      role: 'Student',
      major: 'Physics',
      societies: ['Physics Society'],
      president_of: [],
      is_president: false,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    apiClient.get.mockResolvedValue({ data: mockStudents });
    apiClient.request.mockResolvedValue({ data: { success: true } });
  });

  const renderWithProviders = (searchTerm = '') => {
    return render(
      <ThemeProvider theme={theme}>
        <SearchContext.Provider value={{ searchTerm, setSearchTerm: vi.fn() }}>
          <MemoryRouter>
            <StudentList />
          </MemoryRouter>
        </SearchContext.Provider>
      </ThemeProvider>
    );
  };

  it('renders the component with correct title', async () => {
    await act(async () => {
      renderWithProviders();
    });

    expect(screen.getByText('Student List')).toBeInTheDocument();
  });

  it('fetches and displays students correctly', async () => {
    await act(async () => {
      renderWithProviders();
    });

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/students');
    });

    await waitFor(() => {
      const viewButtons = screen.getAllByText('View');
      expect(viewButtons.length).toBeGreaterThan(0);
    });
  });

  it('navigates to student view page when View button is clicked', async () => {
    await act(async () => {
      renderWithProviders();
    });

    await waitFor(() => {
      const viewButtons = screen.getAllByText('View');
      expect(viewButtons.length).toBeGreaterThan(0);
    });

    const viewButtons = screen.getAllByText('View');
    
    await act(async () => {
      fireEvent.click(viewButtons[0]);
    });

    expect(mockNavigate).toHaveBeenCalledWith('/admin/view-student/1');
  });

  it('opens and closes delete dialog', async () => {
    await act(async () => {
      renderWithProviders();
    });

    await waitFor(() => {
      const deleteButtons = screen.getAllByText('Delete');
      expect(deleteButtons.length).toBeGreaterThan(0);
    });

    const deleteButtons = screen.getAllByText('Delete');
    
    await act(async () => {
      fireEvent.click(deleteButtons[1]);
    });

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('Cancel');
    
    await act(async () => {
      fireEvent.click(cancelButton);
    });

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('deletes student when Confirm button is clicked with reason', async () => {
    await act(async () => {
      renderWithProviders();
    });

    await waitFor(() => {
      const deleteButtons = screen.getAllByText('Delete');
      expect(deleteButtons.length).toBeGreaterThan(0);
    });

    const deleteButtons = screen.getAllByText('Delete');
    await act(async () => {
      fireEvent.click(deleteButtons[1]);
    });

    const reasonInput = screen.getByLabelText('Reason for Deletion');
    await act(async () => {
      fireEvent.change(reasonInput, { target: { value: 'Graduated' } });
    });

    const confirmButton = screen.getByText('Delete Student');
    await act(async () => {
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(apiClient.request).toHaveBeenCalledWith({
        method: 'DELETE',
        url: '/api/users/Student/2/delete',
        data: { reason: 'Graduated' },
      });
    });
  });

  it('handles API error when fetching students', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    apiClient.get.mockRejectedValueOnce(new Error('Failed to fetch students'));

    await act(async () => {
      renderWithProviders();
    });

    expect(consoleSpy).toHaveBeenCalledWith('Error fetching students:', expect.any(Error));
    
    consoleSpy.mockRestore();
  });

  it('handles API error when deleting student', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    apiClient.request.mockRejectedValueOnce(new Error('Failed to delete student'));

    await act(async () => {
      renderWithProviders();
    });

    await waitFor(() => {
      const deleteButtons = screen.getAllByText('Delete');
      expect(deleteButtons.length).toBeGreaterThan(0);
    });

    const deleteButtons = screen.getAllByText('Delete');
    await act(async () => {
      fireEvent.click(deleteButtons[1]);
    });

    const reasonInput = screen.getByLabelText('Reason for Deletion');
    await act(async () => {
      fireEvent.change(reasonInput, { target: { value: 'Testing error' } });
    });

    const confirmButton = screen.getByText('Delete Student');
    await act(async () => {
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error deleting student:', expect.any(Error));
    });
    
    consoleSpy.mockRestore();
  });
});