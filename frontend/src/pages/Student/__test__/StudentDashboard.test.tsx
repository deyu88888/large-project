import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import StudentDashboard from '../StudentDashboard';
import { apiClient } from '../../../api';

// Mock react-router-dom
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: vi.fn(() => vi.fn()),
  };
});

// Mock apiClient
vi.mock('../../../api', () => ({
  apiClient: {
    get: vi.fn(() => Promise.resolve({ data: [] })),
    post: vi.fn(() => Promise.resolve({})),
    delete: vi.fn(() => Promise.resolve({})),
    patch: vi.fn(() => Promise.resolve({ status: 200 })),
  },
}));

describe('StudentDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the dashboard with expected content', async () => {
    render(
      <BrowserRouter>
        <StudentDashboard />
      </BrowserRouter>
    );
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
    expect(screen.getByText('My Societies')).toBeInTheDocument();
    expect(screen.getByText('Society Events')).toBeInTheDocument();
    expect(screen.getByText('Unread Notifications')).toBeInTheDocument();
  });

  it('switches to events tab and shows events', async () => {
    vi.mocked(apiClient.get).mockImplementation((url) => {
      if (url === '/api/student-societies') {
        return Promise.resolve({ data: [{ id: 1, name: 'Test Society' }] });
      } else if (url === '/api/events/') {
        return Promise.resolve({ data: [{ id: 1, title: 'Test Event', date: '2023-10-20', hostedBy: 1 }] });
      }
      return Promise.resolve({ data: [] });
    });

    render(
      <BrowserRouter>
        <StudentDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    const eventsTab = screen.getByText('Events', { selector: '[role="tab"]' });
    await userEvent.click(eventsTab);

    await waitFor(() => {
      expect(screen.getByText('Test Event')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('handles navigation to start society page', async () => {
    const navigateMock = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(navigateMock);

    render(
      <BrowserRouter>
        <StudentDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    const createButton = screen.getByText('Create New Society');
    await userEvent.click(createButton);

    expect(navigateMock).toHaveBeenCalledWith('/student/start-society');
  });
});