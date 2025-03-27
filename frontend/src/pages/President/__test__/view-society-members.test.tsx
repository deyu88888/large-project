import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ViewSocietyMembers from '../ViewSocietyMembers';
import { useAuthStore } from '../../../stores/auth-store';
import { apiClient } from '../../../api';

const mockNavigate = vi.fn();
let mockSocietyId = '456';

// Mock the router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ societyId: mockSocietyId }),
  };
});

// Mock the API module including apiPaths
vi.mock('../../../api', () => {
  return {
    apiClient: {
      get: vi.fn(),
      patch: vi.fn(),
    },
    apiPaths: {
      SOCIETY: {
        MANAGE_DETAILS: (id) => `/api/society/${id}/details/`
      }
    }
  };
});

// Mock auth store
vi.mock('../../../stores/auth-store', () => ({
  useAuthStore: vi.fn(),
}));

const theme = createTheme();

describe('ViewSocietyMembers Component', () => {
  const mockSociety = {
    id: 456,
    name: 'Test Society',
    president: { id: 100 },
    vice_president: { id: 101 },
    event_manager: { id: 102 }
  };

  const mockMembers = [
    {
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      username: 'johndoe',
    },
    {
      id: 2,
      first_name: 'Jane',
      last_name: 'Smith',
      username: 'janesmith',
    },
  ];

  const mockUser = { president_of: 123 };

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockReset();
    mockSocietyId = '456';
    (useAuthStore as vi.Mock).mockReturnValue({ user: mockUser });
    
    // Set up default mocks for API calls
    (apiClient.get as vi.Mock).mockImplementation((url: string) => {
      if (url.includes('/members/')) {
        return Promise.resolve({ data: mockMembers });
      }
      if (url.includes('/details/')) {
        return Promise.resolve({ data: mockSociety });
      }
      return Promise.resolve({ data: [] });
    });
  });

  function renderComponent(societyId?: string) {
    if (societyId) {
      mockSocietyId = societyId;
    }

    const routes = [
      {
        path: '/president-page/:societyId/members',
        element: <ViewSocietyMembers />,
      },
      {
        path: '/president-page/members',
        element: <ViewSocietyMembers />,
      },
    ];
    
    const initialEntry = societyId
      ? `/president-page/${societyId}/members`
      : '/president-page/members';

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
  }

  it('renders loading state initially', async () => {
    // Mock API delay
    const originalGet = apiClient.get;
    (apiClient.get as vi.Mock).mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({ data: mockMembers }), 100))
    );
    
    renderComponent();
    
    // Check for loading state
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    }, { timeout: 200 });
  });

  it('fetches and renders society members', async () => {
    renderComponent();
    
    // Wait for loading to finish and content to appear
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check that society name is rendered
    expect(screen.getByText(/Test Society Members/i, { exact: false })).toBeInTheDocument();
    
    // Check for member names - using a more flexible approach for finding text
    await waitFor(() => {
      expect(screen.getByText(/John Doe/i, { exact: false })).toBeInTheDocument();
      expect(screen.getByText(/Jane Smith/i, { exact: false })).toBeInTheDocument();
    });
    
    // Verify API calls
    expect(apiClient.get).toHaveBeenCalledWith(`/api/society/${mockSocietyId}/details/`);
    expect(apiClient.get).toHaveBeenCalledWith(`/api/society/${mockSocietyId}/members/`);
  });

  it('handles the case when no society id is available', async () => {
    mockSocietyId = '';
    (useAuthStore as vi.Mock).mockReturnValue({ user: {} });
    
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    renderComponent('');
    
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching data:',
        expect.objectContaining({ message: 'No society id available' })
      );
    });
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    consoleErrorSpy.mockRestore();
  });

  it('navigates to view profile when "View Profile" button is clicked', async () => {
    renderComponent();
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Find and click the View Profile button
    const viewProfileButtons = screen.getAllByText('View Profile');
    fireEvent.click(viewProfileButtons[0]);
    
    expect(mockNavigate).toHaveBeenCalledWith(`/student/profile/1`);
  });

  it('navigates to give award page when "Give Award" button is clicked', async () => {
    renderComponent();
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Find and click the Give Award button
    const giveAwardButtons = screen.getAllByText('Give Award');
    fireEvent.click(giveAwardButtons[0]);
    
    expect(mockNavigate).toHaveBeenCalledWith(`/president-page/${mockSocietyId}/give-award-page/1`);
  });

  it('navigates to assign role page when "Assign Role" button is clicked', async () => {
    renderComponent();
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Find and click the Assign Role button
    const assignRoleButtons = screen.getAllByText('Assign Role');
    fireEvent.click(assignRoleButtons[0]);
    
    expect(mockNavigate).toHaveBeenCalledWith(`/president-page/${mockSocietyId}/assign-role/1`);
  });

  it('renders "No members found" when members list is empty', async () => {
    // Mock empty members list
    (apiClient.get as vi.Mock).mockImplementation((url: string) => {
      if (url.includes('/members/')) {
        return Promise.resolve({ data: [] });
      }
      if (url.includes('/details/')) {
        return Promise.resolve({ data: mockSociety });
      }
      return Promise.resolve({ data: [] });
    });
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    expect(screen.getByText('No members found.')).toBeInTheDocument();
  });

  it('handles API error when fetching members', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock API error
    (apiClient.get as vi.Mock).mockRejectedValueOnce(new Error('Fetch error'));
    
    renderComponent();
    
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching data:',
        expect.any(Error)
      );
    });
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    consoleErrorSpy.mockRestore();
  });

  it('navigates back to previous page when "Back to Dashboard" is clicked', async () => {
    renderComponent();
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Find and click the Back button
    const backButton = screen.getByText('Back to Dashboard');
    fireEvent.click(backButton);
    
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('can fetch members using provided society ID in URL', async () => {
    const specificSocietyId = '789';
    renderComponent(specificSocietyId);
    
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith(`/api/society/${specificSocietyId}/members/`);
    });
  });
});