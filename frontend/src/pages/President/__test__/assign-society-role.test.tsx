import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter, Routes, Route, useParams, useNavigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import AssignSocietyRole from '../assign-society-role';
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


const theme = createTheme();

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

  it('disables buttons and shows loading spinner during role assignment', async () => {
    // Create a slow-resolving promise to simulate loading
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
});