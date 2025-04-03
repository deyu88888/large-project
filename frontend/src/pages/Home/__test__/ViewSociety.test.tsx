import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ViewSociety from '../ViewSociety';
import { apiClient } from '../../../api';

vi.mock('../../../components/SocietyDetailLayout', () => ({
  default: vi.fn(({ society, loading, joined, onJoinSociety }) => {
    if (loading) {
      return <div data-testid="loading-spinner">Loading society...</div>;
    }
    return (
      <div>
        {society && (
          <>
            <div>{society.name}</div>
            <div>{society.description}</div>
            {!joined && (
              <button onClick={() => onJoinSociety(society.id)}>
                Join Society
              </button>
            )}
          </>
        )}
      </div>
    );
  })
}));

vi.mock('../../../api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn()
  }
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ society_id: '1' }),
    useLocation: () => ({ pathname: '/view-society/1' })
  };
});

describe('ViewSociety Component', () => {
  const mockSocietyData = {
    id: 1,
    name: 'Test Society',
    description: 'A test society',
    is_member: 0,
    president: {
      id: 123,
      first_name: 'John',
      last_name: 'Doe'
    }
  };

  const renderComponent = () => {
    return render(
      <MemoryRouter initialEntries={['/view-society/1']}>
        <Routes>
          <Route path="/view-society/:society_id" element={<ViewSociety />} />
        </Routes>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    vi.resetAllMocks();
    (apiClient.get as any).mockResolvedValue({ data: mockSocietyData });
    window.scrollTo = vi.fn();
    window.alert = vi.fn();
  });

  it('fetches and renders society details', async () => {
    renderComponent();

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/society/view/1');
    });

    await waitFor(() => {
      expect(screen.getByText('Test Society')).toBeInTheDocument();
      expect(screen.getByText('A test society')).toBeInTheDocument();
    });
  });

  it('handles loading state', async () => {
    (apiClient.get as any).mockImplementation(() => new Promise(() => {}));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });

  it('handles API error when fetching society details', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (apiClient.get as any).mockRejectedValue(new Error('Network error'));

    renderComponent();

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error retrieving society:', 
        expect.any(Error)
      );
      expect(window.alert).toHaveBeenCalledWith('Failed to load society. Please try again.');
    });

    consoleErrorSpy.mockRestore();
  });

  it('allows joining society when not a member', async () => {
    (apiClient.post as any).mockResolvedValue({ 
      data: { message: 'Join request sent' } 
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Join Society')).toBeInTheDocument();
    });

    const joinButton = screen.getByText('Join Society');
    await userEvent.click(joinButton);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/api/society/join/1/');
      expect(window.alert).toHaveBeenCalledWith('Join request sent');
    });
  });

  it('handles error when joining society fails', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (apiClient.post as any).mockRejectedValue({ 
      response: { 
        data: { 
          message: 'Join request failed' 
        } 
      } 
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Join Society')).toBeInTheDocument();
    });

    const joinButton = screen.getByText('Join Society');
    await userEvent.click(joinButton);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/api/society/join/1/');
      expect(window.alert).toHaveBeenCalledWith('Join request failed');
    });

    consoleErrorSpy.mockRestore();
  });

  it('handles scrolling on pathname change', async () => {
    const scrollToSpy = vi.spyOn(window, 'scrollTo');

    await act(async () => {
      renderComponent();
    });

    expect(scrollToSpy).toHaveBeenCalledWith(0, 0);

    scrollToSpy.mockRestore();
  });

  it('sets joined state correctly based on membership status', async () => {
    const memberSocietyData = { ...mockSocietyData, is_member: 1 };
    (apiClient.get as any).mockResolvedValue({ data: memberSocietyData });

    renderComponent();

    await waitFor(() => {
      expect(screen.queryByText('Join Society')).not.toBeInTheDocument();
    });
  });
});