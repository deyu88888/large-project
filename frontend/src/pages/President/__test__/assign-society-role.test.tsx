import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import AssignSocietyRole from '../assign-society-role';
import { apiClient } from '../../../api';

// Mock the dependencies
vi.mock('../../../api', () => ({
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

  // Mock react-router-dom hooks
  const mockUseParams = vi.fn().mockReturnValue({
    society_id: mockSocietyId,
    student_id: mockStudentId
  });

  vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
      ...actual,
      useParams: () => mockUseParams(),
      useNavigate: () => mockNavigate,
    };
  });

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Mock window.alert
    global.alert = mockAlert;

    // Reset API client mock
    (apiClient.patch as vi.Mock).mockResolvedValue({
      data: { success: true }
    });
  });

  const renderComponent = () => {
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

    // Check page title
    expect(screen.getByText('Assign Society Role')).toBeInTheDocument();

    // Check student ID is displayed
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

  it('calls API with correct payload when assigning a role', async () => {
    renderComponent();

    // Click Vice President role
    const vicePresidentButton = screen.getByText('Vice President');
    fireEvent.click(vicePresidentButton);

    // Wait for API call
    await waitFor(() => {
      expect(apiClient.patch).toHaveBeenCalledWith(
        `/api/manage-society-details/${mockSocietyId}`,
        { vice_president: Number(mockStudentId) }
      );
    });

    // Check alert and navigation
    expect(mockAlert).toHaveBeenCalledWith('Assigned vice president role to student 456');
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('handles role assignment error', async () => {
    // Mock API error
    const errorMessage = 'Failed to assign role';
    (apiClient.patch as vi.Mock).mockRejectedValueOnce(new Error(errorMessage));

    renderComponent();

    // Spy on console.error
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Click Treasurer role
    const treasurerButton = screen.getByText('Treasurer');
    fireEvent.click(treasurerButton);

    // Wait for error handling
    await waitFor(() => {
      // Check error state is displayed
      expect(screen.getByText('Failed to assign role. Please try again.')).toBeInTheDocument();
    });

    // Verify console error was called
    expect(consoleErrorSpy).toHaveBeenCalled();

    // Cleanup
    consoleErrorSpy.mockRestore();
  });

  it('disables buttons and shows loading spinner during role assignment', async () => {
    // Create a slow-resolving promise to simulate loading
    const slowPatch = new Promise(() => {});
    (apiClient.patch as vi.Mock).mockImplementationOnce(() => slowPatch);

    renderComponent();

    // Click Event Manager role
    const eventManagerButton = screen.getByText('Event Manager');
    fireEvent.click(eventManagerButton);

    // Check buttons are disabled
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toBeDisabled();
    });

    // Check loading spinner is visible
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('provides a back button to navigate away', () => {
    renderComponent();

    const backButton = screen.getByText('Back');
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});