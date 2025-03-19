import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { apiClient } from '../../../api';
import PendingMembers from '../PendingMembers';

vi.mock('../../../api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ societyId: '123' }),
  };
});

describe('PendingMembers Component', () => {
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
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (apiClient.get).mockResolvedValue({
      data: mockPendingMembers,
    });
    (apiClient.post).mockResolvedValue({});
  });

  function renderComponent() {
    return render(
      <MemoryRouter>
        <PendingMembers />
      </MemoryRouter>
    );
  }

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
    (apiClient.get).mockResolvedValueOnce({ data: [] });
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('No pending membership requests.')).toBeInTheDocument();
    });
  });

  it('handles API error when fetching pending members', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (apiClient.get).mockRejectedValueOnce(new Error('Fetch error'));
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
        approved: true,
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
        approved: false,
      });
      expect(apiClient.get).toHaveBeenCalledTimes(2);
    });
  });

  it('handles error when updating member status', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (apiClient.post).mockRejectedValueOnce(new Error('Update error'));
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