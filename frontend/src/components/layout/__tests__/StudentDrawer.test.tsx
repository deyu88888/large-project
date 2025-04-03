import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import StudentDrawer from '../StudentDrawer';
import { apiClient } from '../../../api';

vi.mock('../../../api', () => ({
  apiClient: {
    get: vi.fn()
  }
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn()
  };
});

const mockStudent = {
  id: 1,
  username: 'testuser',
  first_name: 'Test',
  last_name: 'User',
  icon: 'https://example.com/avatar.png'
};

describe('StudentDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    apiClient.get.mockResolvedValue({
      data: mockStudent
    });
  });

  it('renders drawer correctly when open', async () => {
    render(
      <BrowserRouter>
        <StudentDrawer
          drawer={true}
          toggleDrawer={vi.fn()}
          location={{ pathname: '/student' }}
        />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/user/current');
    });

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('My Societies')).toBeInTheDocument();
    expect(screen.getByText('Start A Society')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('Student')).toBeInTheDocument();
    expect(screen.getByAltText('testuser icon')).toBeInTheDocument();
  });

  it('renders drawer correctly when closed', async () => {
    render(
      <BrowserRouter>
        <StudentDrawer
          drawer={false}
          toggleDrawer={vi.fn()}
          location={{ pathname: '/student' }}
        />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/user/current');
    });

    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(screen.queryByText('Test User')).not.toBeInTheDocument();
    expect(screen.getByAltText('testuser icon')).toBeInTheDocument();
  });

  it('calls toggleDrawer when button is clicked', async () => {
    const toggleDrawerMock = vi.fn();
    
    render(
      <BrowserRouter>
        <StudentDrawer
          drawer={true}
          toggleDrawer={toggleDrawerMock}
          location={{ pathname: '/student' }}
        />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/user/current');
    });

    const chevronButton = screen.getByTestId('ChevronLeftIcon').closest('button');
    fireEvent.click(chevronButton);
    
    expect(toggleDrawerMock).toHaveBeenCalledTimes(1);
  });

  it('handles API error gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const alertMock = vi.fn();
    global.alert = alertMock;
    
    apiClient.get.mockRejectedValue(new Error('API Error'));

    render(
      <BrowserRouter>
        <StudentDrawer
          drawer={true}
          toggleDrawer={vi.fn()}
          location={{ pathname: '/student' }}
        />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/user/current');
      expect(consoleSpy).toHaveBeenCalled();
      expect(alertMock).toHaveBeenCalledWith('Failed to retrieve student. Please contact an administrator.');
    });

    consoleSpy.mockRestore();
  });

  it('logs out user when logout button is clicked', async () => {
    localStorage.setItem('access', 'test-token');
    localStorage.setItem('refresh', 'refresh-token');
    
    render(
      <BrowserRouter>
        <StudentDrawer
          drawer={true}
          toggleDrawer={vi.fn()}
          location={{ pathname: '/student' }}
        />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/user/current');
    });

    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);

    expect(localStorage.getItem('access')).toBeNull();
    expect(localStorage.getItem('refresh')).toBeNull();
  });

  it('selects menu item when clicked', async () => {
    render(
      <BrowserRouter>
        <StudentDrawer
          drawer={true}
          toggleDrawer={vi.fn()}
          location={{ pathname: '/student' }}
        />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/user/current');
    });

    const myEventsItem = screen.getByText('My Events');
    fireEvent.click(myEventsItem);

    expect(myEventsItem).toBeInTheDocument();
  });
});