import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { apiClient } from '../../api'; // Adjust the import path as needed
import AssignSocietyRole from './assign-society-role'; // Adjust the import path as needed

// Mock the dependencies
vi.mock('../../api', () => ({
  apiClient: {
    patch: vi.fn(),
  },
}));

// Create a mock theme
const theme = createTheme();

describe('AssignSocietyRole Component', () => {
  const mockNavigate = vi.fn();
  const mockSocietyId = '123';
  const mockStudentId = '456';
  const mockAlert = vi.fn();

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock window.alert
    global.alert = mockAlert;

    // Mock useNavigate
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom');
      return {
        ...actual,
        useNavigate: () => mockNavigate,
      };
    });

    // Mock API client success response
    (apiClient.patch as vi.Mock).mockResolvedValue({
      data: { success: true }
    });
  });

  const renderComponent = (societyId = mockSocietyId, studentId = mockStudentId) => {
    return render(
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={[`/president-page/${societyId}/assign-society-role/${studentId}`]}>
          <Routes>
            <Route 
              path="/president-page/:society_id/assign-society-role/:student_id" 
              element={<AssignSocietyRole />} 
            />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    );
  };

  it('renders the component with correct title and student ID', () => {
    renderComponent();
    
    expect(screen.getByText('Assign Society Role')).toBeInTheDocument();
    expect(screen.getByText(`Choose a role to assign to student with ID: ${mockStudentId}`)).toBeInTheDocument();
  });

  it('displays all available roles', () => {
    renderComponent();
    
    expect(screen.getByText('Vice President')).toBeInTheDocument();
    expect(screen.getByText('Event Manager')).toBeInTheDocument();
    expect(screen.getByText('Treasurer')).toBeInTheDocument();
  });

  it('calls API with correct payload when assigning Vice President role', async () => {
    renderComponent();
    
    fireEvent.click(screen.getByText('Vice President'));
    
    await waitFor(() => {
      expect(apiClient.patch).toHaveBeenCalledWith(
        `/api/manage-society-details/${mockSocietyId}`,
        { vice_president: Number(mockStudentId) }
      );
    });

    expect(mockAlert).toHaveBeenCalledWith(`Assigned vice president role to student ${mockStudentId}`);
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('calls API with correct payload when assigning Event Manager role', async () => {
    renderComponent();
    
    fireEvent.click(screen.getByText('Event Manager'));
    
    await waitFor(() => {
      expect(apiClient.patch).toHaveBeenCalledWith(
        `/api/manage-society-details/${mockSocietyId}`,
        { event_manager: Number(mockStudentId) }
      );
    });
  });

  it('calls API with correct payload when assigning Treasurer role', async () => {
    renderComponent();
    
    fireEvent.click(screen.getByText('Treasurer'));
    
    await waitFor(() => {
      expect(apiClient.patch).toHaveBeenCalledWith(
        `/api/manage-society-details/${mockSocietyId}`,
        { treasurer: Number(mockStudentId) }
      );
    });
  });

  it('shows loading state while API request is in progress', async () => {
    // Create a promise that we can resolve manually
    let resolveApiCall: () => void;
    const apiPromise = new Promise<any>((resolve) => {
      resolveApiCall = () => resolve({ data: { success: true } });
    });
    
    (apiClient.patch as vi.Mock).mockReturnValue(apiPromise);
    
    renderComponent();
    
    fireEvent.click(screen.getByText('Vice President'));
    
    // Buttons should be disabled during loading
    await waitFor(() => {
      expect(screen.getByText('Vice President')).toBeDisabled();
      expect(screen.getByText('Event Manager')).toBeDisabled();
      expect(screen.getByText('Treasurer')).toBeDisabled();
      expect(screen.getByText('Back')).toBeDisabled();
    });
    
    // CircularProgress should be visible
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    
    // Resolve the API call
    resolveApiCall!();
    
    // After API call completes, loading state should be removed
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });

  it('displays error message when API request fails', async () => {
    const errorMessage = 'API Error';
    (apiClient.patch as vi.Mock).mockRejectedValueOnce(new Error(errorMessage));
    
    renderComponent();
    
    fireEvent.click(screen.getByText('Vice President'));
    
    await waitFor(() => {
      expect(screen.getByText('Failed to assign role. Please try again.')).toBeInTheDocument();
    });
    
    // It should log the error
    expect(console.error).toHaveBeenCalled();
  });

  it('navigates back when Back button is clicked', () => {
    renderComponent();
    
    fireEvent.click(screen.getByText('Back'));
    
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});