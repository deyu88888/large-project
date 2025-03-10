import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ViewSocietyMembers from '../view-society-members';
import { apiClient } from '../../../api';
import { useAuthStore } from '../../../stores/auth-store';


const mockNavigate = vi.fn();


vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});


vi.mock('../../../api', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

vi.mock('../../../stores/auth-store', () => ({
  useAuthStore: vi.fn(),
}));


const theme = createTheme();

describe('ViewSocietyMembers Component', () => {
  const mockMembers = [
    {
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      username: 'johndoe'
    },
    {
      id: 2,
      first_name: 'Jane',
      last_name: 'Smith',
      username: 'janesmith'
    }
  ];

  const mockUser = { president_of: 123 };

  beforeEach(() => {

    vi.clearAllMocks();
    

    mockNavigate.mockReset();


    (useAuthStore as vi.Mock).mockReturnValue({ user: mockUser });


    (apiClient.get as vi.Mock).mockResolvedValue({
      data: mockMembers
    });
  });

  const renderComponent = (societyId?: string) => {
    const routes = societyId 
      ? [{ path: '/president/view-society-members/:society_id', element: <ViewSocietyMembers /> }]
      : [{ path: '/president/view-society-members', element: <ViewSocietyMembers /> }];

    const initialEntry = societyId 
      ? `/president/view-society-members/${societyId}`
      : '/president/view-society-members';

    return render(
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            {routes.map((route, index) => (
              <Route key={index} path={route.path} element={route.element} />
            ))}
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    );
  };

  it('renders loading state initially', async () => {
    renderComponent();

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('fetches and renders society members', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    expect(apiClient.get).toHaveBeenCalledWith('/api/society/123/members/');
  });

  it('handles the case when no society id is available', async () => {
    // Mock the user store to return a user without president_of
    (useAuthStore as vi.Mock).mockReturnValue({ user: {} });
    
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Render without society_id in the URL
    renderComponent();

    // Wait for the component to process and catch the error
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching society members:', 
        expect.objectContaining({ message: 'No society id available' })
      );
    });

    // Ensure the loading state is cleared
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });

  it('navigates to view profile when "View Profile" button is clicked', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const viewProfileButtons = screen.getAllByText('View Profile');
    fireEvent.click(viewProfileButtons[0]);

    expect(mockNavigate).toHaveBeenCalledWith('/profile/1');
  });

  it('navigates to give award page when "Give Award" button is clicked', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const giveAwardButtons = screen.getAllByText('Give Award');
    fireEvent.click(giveAwardButtons[0]);

    expect(mockNavigate).toHaveBeenCalledWith('../give-award-page/1');
  });

  it('navigates to assign role page when "Assign Role" button is clicked', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const assignRoleButtons = screen.getAllByText('Assign Role');
    fireEvent.click(assignRoleButtons[0]);

    expect(mockNavigate).toHaveBeenCalledWith('../assign-society-role/1');
  });

  it('renders "No members found" when members list is empty', async () => {
    (apiClient.get as vi.Mock).mockResolvedValueOnce({ data: [] });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('No members found.')).toBeInTheDocument();
    });
  });

  it('handles API error when fetching members', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    (apiClient.get as vi.Mock).mockRejectedValueOnce(new Error('Fetch error'));

    renderComponent();

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching society members:', 
        expect.any(Error)
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it('navigates back to previous page when "Back to Dashboard" is clicked', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const backButton = screen.getByText('Back to Dashboard');
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('can fetch members using provided society ID in URL', async () => {
    renderComponent('456');

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/society/456/members/');
    });
  });
});