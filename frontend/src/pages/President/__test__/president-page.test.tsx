import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import PresidentPage from '..';
import { apiClient } from '../../../api';
import { useAuthStore } from '../../../stores/auth-store';

// Mock dependencies
vi.mock('../../../api', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

vi.mock('../../../stores/auth-store', () => ({
  useAuthStore: vi.fn(),
}));

// Create a mock theme
const theme = createTheme();

describe('PresidentPage Component', () => {
  const mockSociety = {
    id: 123,
    name: 'Test Society',
  };

  const mockPendingMembers = [
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
    },
    {
      id: 3,
      first_name: 'Alice',
      last_name: 'Johnson',
      username: 'alicejohnson'
    },
    {
      id: 4,
      first_name: 'Bob',
      last_name: 'Brown',
      username: 'bobbrown'
    }
  ];

  const mockNavigate = vi.fn();
  const mockUser = { president_of: 123 };

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock useNavigate
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom');
      return {
        ...actual,
        useNavigate: () => mockNavigate,
      };
    });

    // Mock useAuthStore
    (useAuthStore as vi.Mock).mockReturnValue({ user: mockUser });

    // Mock API client
    (apiClient.get as vi.Mock)
      .mockImplementationOnce(() => Promise.resolve({ data: mockSociety })) // Society details
      .mockImplementationOnce(() => Promise.resolve({ data: mockPendingMembers })); // Pending members
  });

  const renderComponent = (societyId?: string) => {
    const routes = societyId 
      ? [{ path: '/president-page/:society_id', element: <PresidentPage /> }]
      : [{ path: '/president-page', element: <PresidentPage /> }];

    const initialEntry = societyId 
      ? `/president-page/${societyId}`
      : '/president-page';

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

  it('fetches and displays society details', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Test Society')).toBeInTheDocument();
    });

    // Verify API calls
    expect(apiClient.get).toHaveBeenCalledWith('/api/manage-society-details/123/');
    expect(apiClient.get).toHaveBeenCalledWith('/api/society/123/pending-members/');
  });

  it('renders navigation buttons', async () => {
    renderComponent();

    await waitFor(() => {
      const navigationButtons = [
        'Society Details',
        'Society Events',
        'Pending Members',
        'Report to Admin',
        'All Members'
      ];

      navigationButtons.forEach(buttonText => {
        expect(screen.getByText(buttonText)).toBeInTheDocument();
      });
    });
  });

  it('navigates to correct pages when buttons are clicked', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Test Society')).toBeInTheDocument();
    });

    const navigationTests = [
      { text: 'Society Details', expectedPath: 'manage-society-details' },
      { text: 'Society Events', expectedPath: 'manage-society-events' },
      { text: 'Pending Members', expectedPath: 'pending-members' },
      { text: 'Report to Admin', expectedPath: 'report-to-admin' },
      { text: 'All Members', expectedPath: 'view-society-members' }
    ];

    navigationTests.forEach(({ text, expectedPath }) => {
      const button = screen.getByText(text);
      fireEvent.click(button);
      expect(mockNavigate).toHaveBeenCalledWith(expectedPath);
    });
  });

  it('displays pending members preview', async () => {
    renderComponent();

    await waitFor(() => {
      // Check preview section header
      expect(screen.getByText('Pending Members (Preview)')).toBeInTheDocument();

      // Check first 3 members are displayed
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();

      // Verify "View All" button appears when more than 3 members
      expect(screen.getByText('View All Pending Members')).toBeInTheDocument();
    });
  });

  it('handles scenario with no pending members', async () => {
    // Reset mock to return empty array
    (apiClient.get as vi.Mock)
      .mockImplementationOnce(() => Promise.resolve({ data: mockSociety }))
      .mockImplementationOnce(() => Promise.resolve({ data: [] }));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('No pending membership requests.')).toBeInTheDocument();
    });
  });

  it('handles error when fetching data', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock API calls to fail
    (apiClient.get as vi.Mock)
      .mockRejectedValueOnce(new Error('Society fetch failed'))
      .mockRejectedValueOnce(new Error('Pending members fetch failed'));

    renderComponent();

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching president data:', 
        expect.any(Error)
      );
    });

    consoleErrorSpy.mockRestore();
  });
});