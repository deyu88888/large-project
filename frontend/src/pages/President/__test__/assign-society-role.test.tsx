import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import AssignSocietyRole from '../AssignSocietyRole';
import { apiClient } from '../../../api';

vi.mock('../../../api', () => ({
  apiClient: {
    patch: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
const mockUseParams = vi.fn().mockReturnValue({
  societyId: '123',
  memberId: '456'
});

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => mockUseParams(),
    useNavigate: () => mockNavigate,
  };
});

describe('AssignSocietyRole Component', () => {
  const mockSocietyId = '123';
  const mockMemberId = '456';
  const mockAlert = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseParams.mockReturnValue({
      societyId: mockSocietyId,
      memberId: mockMemberId
    });
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

    // Cleanup previous renders to avoid duplicate elements
    // This is important when calling renderComponent() multiple times in a single test
    screen.debug = vi.fn();

    return render(
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={[`/president/assign-role/${mockSocietyId}/${mockMemberId}`]}>
          <Routes>
            <Route path="/president/assign-role/:societyId/:memberId" element={<AssignSocietyRole />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    );
  };

  it('renders the assign society role page correctly', () => {
    renderComponent();
    expect(screen.getByText('Assign Society Role')).toBeInTheDocument();
    expect(screen.getByText(/Choose a role to assign to student with ID/)).toBeInTheDocument();
    expect(screen.getByText(mockMemberId, {exact: false})).toBeInTheDocument();
  });

  it('displays all role buttons', () => {
    renderComponent();
    const expectedRoles = [
      'Vice President',
      'Event Manager'
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
        `/api/society/${mockSocietyId}/roles/`,
        { vice_president: Number(mockMemberId) }
      );
    });
    
    expect(mockAlert).toHaveBeenCalledWith(`Assigned vice president role to student ${mockMemberId}`);
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('handles different role assignments with correct payloads', async () => {
    renderComponent();
    
    const eventManagerButton = screen.getByText('Event Manager');
    fireEvent.click(eventManagerButton);
    
    await waitFor(() => {
      expect(apiClient.patch).toHaveBeenCalledWith(
        `/api/society/${mockSocietyId}/roles/`,
        { event_manager: Number(mockMemberId) }
      );
    });
  });

  it('handles role assignment error', async () => {
    const errorMessage = 'Failed to assign role';
    (apiClient.patch as vi.Mock).mockRejectedValueOnce(new Error(errorMessage));

    renderComponent();
    
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const vicePresidentButton = screen.getByText('Vice President');
    fireEvent.click(vicePresidentButton);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to assign role. Please try again.')).toBeInTheDocument();
    });
    
    expect(consoleErrorSpy).toHaveBeenCalled();
    
    consoleErrorSpy.mockRestore();
  });

  it('handles API error with response data', async () => {
    const mockError = {
      response: {
        data: { 
          error: 'API error message' 
        }
      }
    };
    (apiClient.patch as vi.Mock).mockRejectedValueOnce(mockError);

    renderComponent();
    
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const eventManagerButton = screen.getByText('Event Manager');
    fireEvent.click(eventManagerButton);
    
    await waitFor(() => {
      expect(screen.getByText('API error message')).toBeInTheDocument();
    });
    
    expect(consoleErrorSpy).toHaveBeenCalled();
    
    consoleErrorSpy.mockRestore();
  });

  it('does not display error message when no error exists', () => {
    renderComponent();
    expect(screen.queryByText('Failed to assign role. Please try again.')).not.toBeInTheDocument();
  });

  it('disables buttons and shows loading spinner during role assignment', async () => {
    // Use a promise that we control to ensure loading state
    let resolvePromise: (value: any) => void;
    const patchPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    
    (apiClient.patch as vi.Mock).mockImplementationOnce(() => patchPromise);

    // Render the component once with valid params
    const { container } = renderComponent();
    
    // Use first button to avoid multiple element issue
    const buttons = screen.getAllByRole('button');
    const firstRoleButton = buttons[0]; // Vice President button
    
    // Click the button to start loading
    fireEvent.click(firstRoleButton);
    
    // Wait for the component to enter loading state
    await waitFor(() => {
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
    
    // Check all buttons are disabled
    await waitFor(() => {
      const allButtons = screen.getAllByRole('button');
      allButtons.forEach(button => {
        expect(button).toHaveAttribute('disabled');
      });
    });
    
    // Cleanup by resolving the promise
    resolvePromise({ data: { success: true } });
  });

  it('provides a back button to navigate away', () => {
    renderComponent();

    const backButton = screen.getByText('Back');
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('back button is disabled during loading state', async () => {
    const patchPromise = new Promise(() => {}); // Never resolves to keep loading state
    (apiClient.patch as vi.Mock).mockImplementationOnce(() => patchPromise);

    renderComponent();
    
    const vicePresidentButton = screen.getByText('Vice President');
    fireEvent.click(vicePresidentButton);
    
    await waitFor(() => {
      const backButton = screen.getByText('Back');
      expect(backButton).toHaveAttribute('disabled');
    });
  });
  
  it('shows error when society ID is missing', () => {
    // Mock useParams to return without societyId
    mockUseParams.mockReturnValue({
      memberId: mockMemberId
    });
    
    renderComponent();
    
    expect(screen.getByText('Society ID is missing. Please go back and try again.')).toBeInTheDocument();
  });

  it('handles loading state toggling correctly', async () => {
    // Make sure we start with valid parameters
    mockUseParams.mockReturnValue({
      societyId: mockSocietyId,
      memberId: mockMemberId
    });

    // Create a controlled promise that we can manually resolve
    let resolvePromise: (value: any) => void;
    const patchPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    
    (apiClient.patch as vi.Mock).mockImplementationOnce(() => patchPromise);
    
    renderComponent();
    
    // Verify no loading indicator initially
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    
    // Trigger the role assignment
    const roleButton = screen.getByText('Vice President');
    fireEvent.click(roleButton);
    
    // Check loading state is active
    await waitFor(() => {
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
    
    // Resolve the promise to complete the operation
    resolvePromise({ data: { success: true } });
    
    // Check loading state is cleared after resolution
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });
});