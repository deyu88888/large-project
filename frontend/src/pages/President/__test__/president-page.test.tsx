import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, expect } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import PresidentPage from '../president-page';
import { apiClient } from '../../../api';
import { useAuthStore } from '../../../stores/auth-store';

vi.mock('../../../api', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

vi.mock('../../../stores/auth-store', () => ({
  useAuthStore: vi.fn(),
}));

const mockNavigate = vi.fn();
let mockParams = { society_id: '123' };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
  };
});

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
      username: 'johndoe',
    },
    {
      id: 2,
      first_name: 'Jane',
      last_name: 'Smith',
      username: 'janesmith',
    },
    {
      id: 3,
      first_name: 'Alice',
      last_name: 'Johnson',
      username: 'alicejohnson',
    },
    {
      id: 4,
      first_name: 'Bob',
      last_name: 'Brown',
      username: 'bobbrown',
    },
  ];

  const mockUser = { president_of: 123 };

  beforeEach(() => {
    vi.clearAllMocks();
    mockParams = { society_id: '123' };
    (useAuthStore as vi.Mock).mockReturnValue({ user: mockUser });
    (apiClient.get as vi.Mock).mockImplementation((url: string) => {
      if (url.includes('manage-society-details')) {
        return Promise.resolve({ data: mockSociety });
      } else if (url.includes('pending-members')) {
        return Promise.resolve({ data: mockPendingMembers });
      }
      return Promise.resolve({ data: {} });
    });
  });

  function renderComponent() {
    return render(
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={['/president-page/123']}>
          <Routes>
            <Route path="/president-page/:society_id" element={<PresidentPage />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    );
  }

  it('renders loading state initially', () => {
    renderComponent();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('fetches and displays society details', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Test Society', level: 1 })).toBeInTheDocument();
    });
    expect(apiClient.get).toHaveBeenCalledWith('/api/manage-society-details/123/');
    expect(apiClient.get).toHaveBeenCalledWith('/api/society/123/pending-members/');
  });

  it('renders navigation buttons', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    const navigationButtons = ['Society Details', 'Society Events', 'Report to Admin', 'All Members'];
    navigationButtons.forEach((buttonText) => {
      expect(screen.getByRole('button', { name: buttonText })).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Pending Members' })).toBeInTheDocument();
  });

  it('navigates to correct pages when buttons are clicked', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    const navigationTests = [
      { buttonName: 'Society Details', expectedPath: 'manage-society-details' },
      { buttonName: 'Society Events', expectedPath: 'manage-society-events' },
      { buttonName: 'Pending Members', expectedPath: 'pending-members' },
      { buttonName: 'Report to Admin', expectedPath: 'report-to-admin' },
      { buttonName: 'All Members', expectedPath: 'view-society-members' },
    ];
    for (const { buttonName, expectedPath } of navigationTests) {
      const button = screen.getByRole('button', { name: buttonName });
      fireEvent.click(button);
      expect(mockNavigate).toHaveBeenCalledWith(expectedPath);
      mockNavigate.mockClear();
    }
  });

  it('displays pending members preview', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: 'Pending Members', level: 3 })).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    expect(screen.getByText('View All Pending Members')).toBeInTheDocument();
  });

  it('handles scenario with no pending members', async () => {
    (apiClient.get as vi.Mock).mockImplementation((url: string) => {
      if (url.includes('manage-society-details')) {
        return Promise.resolve({ data: mockSociety });
      } else if (url.includes('pending-members')) {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: {} });
    });
    renderComponent();
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    expect(screen.getByText('No pending membership requests.')).toBeInTheDocument();
  });

  it('handles error when fetching data', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (apiClient.get as vi.Mock).mockRejectedValue(new Error('API error'));
    renderComponent();
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching president data:', expect.any(Error));
    });
    consoleErrorSpy.mockRestore();
  });

  it('uses user.president_of when no society_id is provided in URL', async () => {
    mockParams = {};
    renderComponent();
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    expect(apiClient.get).toHaveBeenCalledWith('/api/manage-society-details/123/');
  });

  it('handles error when no society ID is available', async () => {
    mockParams = {};
    (useAuthStore as vi.Mock).mockReturnValue({ user: {} });
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderComponent();
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching president data:',
        expect.objectContaining({ message: 'No society ID available' })
      );
    });
    consoleErrorSpy.mockRestore();
  });

  it('handles the case where pending members API returns null', async () => {
    (apiClient.get as vi.Mock).mockImplementation((url: string) => {
      if (url.includes('manage-society-details')) {
        return Promise.resolve({ data: mockSociety });
      } else if (url.includes('pending-members')) {
        return Promise.resolve({ data: null });
      }
      return Promise.resolve({ data: {} });
    });
    renderComponent();
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    expect(screen.getByText('No pending membership requests.')).toBeInTheDocument();
  });

  it('displays exact number of pending members when less than 3', async () => {
    const fewMembers = mockPendingMembers.slice(0, 2);
    (apiClient.get as vi.Mock).mockImplementation((url: string) => {
      if (url.includes('manage-society-details')) {
        return Promise.resolve({ data: mockSociety });
      } else if (url.includes('pending-members')) {
        return Promise.resolve({ data: fewMembers });
      }
      return Promise.resolve({ data: {} });
    });
    renderComponent();
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.queryByText('View All Pending Members')).not.toBeInTheDocument();
  });

  it('navigates to pending-members page when View All button is clicked', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    const viewAllButton = screen.getByText('View All Pending Members');
    fireEvent.click(viewAllButton);
    expect(mockNavigate).toHaveBeenCalledWith('pending-members');
  });

  it('displays default society name when society data is null', async () => {
    (apiClient.get as vi.Mock).mockImplementation((url: string) => {
      if (url.includes('manage-society-details')) {
        return Promise.resolve({ data: null });
      } else if (url.includes('pending-members')) {
        return Promise.resolve({ data: mockPendingMembers });
      }
      return Promise.resolve({ data: {} });
    });
    renderComponent();
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: 'My Society', level: 1 })).toBeInTheDocument();
  });
});
