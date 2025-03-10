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


vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ society_id: '123' }),
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

  const mockUser = { president_of: 123 };

  beforeEach(() => {
    
    vi.clearAllMocks();

    
    (useAuthStore as vi.Mock).mockReturnValue({ user: mockUser });

    
    (apiClient.get as vi.Mock).mockImplementation((url) => {
      if (url.includes('manage-society-details')) {
        return Promise.resolve({ data: mockSociety });
      } else if (url.includes('pending-members')) {
        return Promise.resolve({ data: mockPendingMembers });
      }
      return Promise.resolve({ data: {} });
    });
  });

  const renderComponent = () => {
    return render(
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={['/president-page/123']}>
          <Routes>
            <Route path="/president-page/:society_id" element={<PresidentPage />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    );
  };

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

    const navigationButtons = [
      'Society Details',
      'Society Events',
      'Report to Admin',
      'All Members'
    ];

   
    navigationButtons.forEach(buttonText => {
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
      { buttonName: 'All Members', expectedPath: 'view-society-members' }
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
    
    (apiClient.get as vi.Mock).mockImplementation((url) => {
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
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching president data:', 
        expect.any(Error)
      );
    });

    consoleErrorSpy.mockRestore();
  });
});