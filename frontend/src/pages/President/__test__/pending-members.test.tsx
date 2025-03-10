import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { apiClient } from '../../../api';
import PendingMembers from '../pending-members';

const mockNavigate = vi.fn();


vi.mock('../../../api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('PendingMembers Component', () => {
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
    }
  ];

  beforeEach(() => {
    
    vi.clearAllMocks();

    
    (apiClient.get as vi.Mock).mockResolvedValue({
      data: mockPendingMembers
    });

    
    (apiClient.post as vi.Mock).mockResolvedValue({});
  });

  const renderComponent = (societyId: string = '123') => {
    return render(
      <MemoryRouter initialEntries={[`/president/pending-members/${societyId}`]}>
        <Routes>
          <Route 
            path="/president/pending-members/:society_id" 
            element={<PendingMembers />} 
          />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders loading state initially', async () => {
    renderComponent();

    expect(screen.getByText('Loading pending members...')).toBeInTheDocument();
  });

  it('fetches and displays pending members', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    expect(apiClient.get).toHaveBeenCalledWith('/api/society/123/pending-members/');
  });

  it('handles empty pending members list', async () => {
    (apiClient.get as vi.Mock).mockResolvedValueOnce({ data: [] });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('No pending membership requests.')).toBeInTheDocument();
    });
  });

  it('handles API error when fetching pending members', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    (apiClient.get as vi.Mock).mockRejectedValueOnce(new Error('Fetch error'));

    renderComponent();

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching pending members:', 
        expect.any(Error)
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it('accepts a pending member', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const acceptButtons = screen.getAllByText('Accept');
    fireEvent.click(acceptButtons[0]);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/api/society/123/pending-members/1/', {
        approved: true
      });
      
      
      expect(apiClient.get).toHaveBeenCalledTimes(2);
    });
  });

  it('rejects a pending member', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const rejectButtons = screen.getAllByText('Reject');
    fireEvent.click(rejectButtons[0]);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/api/society/123/pending-members/1/', {
        approved: false
      });
      
      
      expect(apiClient.get).toHaveBeenCalledTimes(2);
    });
  });

  it('handles error when updating member status', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    (apiClient.post as vi.Mock).mockRejectedValueOnce(new Error('Update error'));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const acceptButtons = screen.getAllByText('Accept');
    fireEvent.click(acceptButtons[0]);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error updating member status:', 
        expect.any(Error)
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it('correctly displays member information', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('johndoe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('janesmith')).toBeInTheDocument();
    });
  });
});