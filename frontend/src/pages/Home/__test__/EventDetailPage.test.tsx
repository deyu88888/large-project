import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { act } from 'react-dom/test-utils';
import EventDetailPage from '../EventDetailPage';
import { apiClient } from '../../../api';
import useAuthCheck from '../../../hooks/useAuthCheck';

vi.mock('../../../api', () => ({
  apiClient: {
    get: vi.fn()
  }
}));

vi.mock('../../../hooks/useAuthCheck');

vi.mock('../../../components/EventDetailLayout', () => ({
  EventDetailLayout: vi.fn(() => <div data-testid="event-detail-layout">Mocked Event Detail Layout</div>)
}));

vi.mock('../../../components/CommentSection', () => ({
  CommentSection: vi.fn(() => <div data-testid="comment-section">Mocked Comment Section</div>)
}));

describe('EventDetailPage', () => {
  const mockEvent = {
    id: 1,
    title: 'Test Event',
    main_description: 'Event Description',
    date: '2024-01-01',
    start_time: '18:00',
    duration: '2 hours',
    location: 'Test Location',
    max_capacity: 100,
    current_attendees: [],
    extra_modules: [],
    participant_modules: [],
    is_participant: false,
    is_member: true,
    cover_image: 'test-image-url',
    hosted_by: 1
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders loading state initially', async () => {
    (useAuthCheck as any).mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: null
    });

    (apiClient.get as any).mockRejectedValue(new Error('Loading'));

    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/events/1']}>
          <Routes>
            <Route path="/events/:event_id" element={<EventDetailPage />} />
          </Routes>
        </MemoryRouter>
      );
    });

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders event details when authenticated', async () => {
    (useAuthCheck as any).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 1 }
    });

    (apiClient.get as any)
      .mockResolvedValueOnce({ data: mockEvent })
      .mockResolvedValueOnce({ data: [] });

    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/events/1']}>
          <Routes>
            <Route path="/events/:event_id" element={<EventDetailPage />} />
          </Routes>
        </MemoryRouter>
      );
    });

    expect(screen.getByTestId('event-detail-layout')).toBeInTheDocument();
    expect(screen.getByTestId('comment-section')).toBeInTheDocument();
  });

  it('renders login prompt when not authenticated', async () => {
    (useAuthCheck as any).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null
    });

    (apiClient.get as any)
      .mockResolvedValueOnce({ data: mockEvent })
      .mockResolvedValueOnce({ data: [] });

    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/events/1']}>
          <Routes>
            <Route path="/events/:event_id" element={<EventDetailPage />} />
          </Routes>
        </MemoryRouter>
      );
    });

    const loginLink = screen.getByText(/login/i, { selector: 'a' });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/login');

    const registerLink = screen.getByText(/here/i, { selector: 'a' });
    expect(registerLink).toBeInTheDocument();
    expect(registerLink).toHaveAttribute('href', '/register');
  });

  it('handles event not found', async () => {
    (useAuthCheck as any).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 1 }
    });

    (apiClient.get as any)
      .mockRejectedValueOnce(new Error('Not Found'))
      .mockRejectedValueOnce(new Error('Not Found'));

    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/events/999']}>
          <Routes>
            <Route path="/events/:event_id" element={<EventDetailPage />} />
          </Routes>
        </MemoryRouter>
      );
    });

    expect(screen.getByText(/event not found/i)).toBeInTheDocument();
  });
});