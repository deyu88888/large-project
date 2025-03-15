import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter, Routes, Route, useParams, useNavigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import AssignSocietyRole from '../AssignSocietyRole';
import { apiClient } from '../../../api';

vi.mock('../../../api', () => ({
  apiClient: {
    patch: vi.fn(),
  },
}));

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({
      society_id: '123',
      student_id: '456'
    }),
    useNavigate: () => mockNavigate,
  };
});

describe('AssignSocietyRole Component', () => {
  const mockSocietyId = '123';
  const mockStudentId = '456';
  const mockAlert = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (apiClient.patch as vi.Mock).mockResolvedValue({
      data: { success: true }
    });
    global.alert = mockAlert;
  });

  const renderComponent = (themeModeOverride = 'light') => {
    const theme = createTheme({
      palette: {
        mode: themeModeOverride as 'light' | 'dark',
      },
    });

    return render(
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={[`/president/assign-role/${mockSocietyId}/${mockStudentId}`]}>
          <Routes>
            <Route path="/president/assign-role/:society_id/:student_id" element={<AssignSocietyRole />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    );
  };

  it('renders the assign society role page correctly', () => {
    renderComponent();
    expect(screen.getByText('Assign Society Role')).toBeInTheDocument();
    expect(screen.getByText(`Choose a role to assign to student with ID: ${mockStudentId}`)).toBeInTheDocument();
  });

  it('displays all role buttons', () => {
    renderComponent();
    const expectedRoles = [
      'Vice President',
      'Event Manager',
      'Treasurer'
    ];

    expectedRoles.forEach(role => {
      expect(screen.getByText(role)).toBeInTheDocument();
    });
  });

  it('renders correctly with dark theme', () => {
    renderComponent('dark');
    expect(screen.getByText('Assign Society Role')).toBeInTheDocument();
  });

  it('calls API with correct payload when assigning a role', async () => {
    renderComponent();
    const vicePresidentButton = screen.getByText('Vice President');
    fireEvent.click(vicePresidentButton);

    await waitFor(() => {
      expect(apiClient.patch).toHaveBeenCalledWith(
        `/api/manage-society-details/${mockSocietyId}`,
        { vice_president: Number(mockStudentId) }
      );
    });
    
    expect(mockAlert).toHaveBeenCalledWith('Assigned vice president role to student 456');
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('handles different role assignments with correct payloads', async () => {
    renderComponent();
    
    const eventManagerButton = screen.getByText('Event Manager');
    fireEvent.click(eventManagerButton);
    
    await waitFor(() => {
      expect(apiClient.patch).toHaveBeenCalledWith(
        `/api/manage-society-details/${mockSocietyId}`,
        { event_manager: Number(mockStudentId) }
      );
    });
    
    vi.clearAllMocks();
    (apiClient.patch as vi.Mock).mockResolvedValue({ data: { success: true } });
    
    const treasurerButton = screen.getByText('Treasurer');
    fireEvent.click(treasurerButton);
    
    await waitFor(() => {
      expect(apiClient.patch).toHaveBeenCalledWith(
        `/api/manage-society-details/${mockSocietyId}`,
        { treasurer: Number(mockStudentId) }
      );
    });
  });

  it('handles role assignment error', async () => {
    const errorMessage = 'Failed to assign role';
    (apiClient.patch as vi.Mock).mockRejectedValueOnce(new Error(errorMessage));

    renderComponent();
    
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const treasurerButton = screen.getByText('Treasurer');
    fireEvent.click(treasurerButton);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to assign role. Please try again.')).toBeInTheDocument();
    });
    
    expect(consoleErrorSpy).toHaveBeenCalled();
    
    consoleErrorSpy.mockRestore();
  });

  it('handles error with response data', async () => {
    const mockError = {
      response: {
        data: { message: 'API error message' }
      }
    };
    (apiClient.patch as vi.Mock).mockRejectedValueOnce(mockError);

    renderComponent();
    
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const eventManagerButton = screen.getByText('Event Manager');
    fireEvent.click(eventManagerButton);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to assign role. Please try again.')).toBeInTheDocument();
    });
    
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error assigning role', mockError.response.data);
    
    consoleErrorSpy.mockRestore();
  });

  it('does not display error message when no error exists', () => {
    renderComponent();
    expect(screen.queryByText('Failed to assign role. Please try again.')).not.toBeInTheDocument();
  });

  it('disables buttons and shows loading spinner during role assignment', async () => {
    (apiClient.patch as vi.Mock).mockImplementationOnce(() => new Promise(() => {}));

    renderComponent();
    
    const eventManagerButton = screen.getByText('Event Manager');
    fireEvent.click(eventManagerButton);
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toBeDisabled();
    });
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('provides a back button to navigate away', () => {
    renderComponent();

    const backButton = screen.getByText('Back');
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('back button is disabled during loading state', async () => {
    (apiClient.patch as vi.Mock).mockImplementationOnce(() => new Promise(() => {}));

    renderComponent();
    
    const roleButton = screen.getByText('Treasurer');
    fireEvent.click(roleButton);
    
    const backButton = screen.getByText('Back');
    expect(backButton).toBeDisabled();
  });

  it('handles loading state toggling correctly', async () => {
    renderComponent();
    
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    
    (apiClient.patch as vi.Mock).mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({ data: { success: true } }), 100))
    );
    
    const roleButton = screen.getByText('Vice President');
    fireEvent.click(roleButton);
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });
});