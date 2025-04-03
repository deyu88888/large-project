import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ProfilePage from '../Profile';
import { apiClient } from '../../../api';
import { useAuthStore } from '../../../stores/auth-store';

// Mock dependencies
vi.mock('../../../api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn()
  },
  apiPaths: {
    USER: {
      BASE: '/api/users'
    }
  }
}));

vi.mock('../../../stores/auth-store');

vi.mock('../../../components/profile/ProfileHeader', () => ({
  __esModule: true,
  default: vi.fn(({ profile, onAvatarUpdated }) => (
    <div data-testid="profile-header">
      Profile Header for {profile.name}
    </div>
  ))
}));

vi.mock('../../../components/profile/ProfileStaticInfo', () => ({
  __esModule: true,
  default: vi.fn(() => <div data-testid="profile-static-info">Profile Static Info</div>)
}));

vi.mock('../../../components/profile/ProfileUserInfo', () => ({
  __esModule: true,
  default: vi.fn(() => <div data-testid="profile-user-info">Profile User Info</div>)
}));

vi.mock('../../../components/profile/ProfileForm', () => ({
  __esModule: true,
  default: vi.fn(() => <div data-testid="profile-form">Profile Form</div>)
}));

vi.mock('../../../components/profile/PasswordForm', () => ({
  __esModule: true,
  default: vi.fn(() => <div data-testid="password-form">Password Form</div>)
}));

vi.mock('../../../components/profile/AwardList', () => ({
  __esModule: true,
  default: vi.fn(() => <div data-testid="award-list">Award List</div>)
}));

vi.mock('../../../components/profile/SnackbarGlobal', () => ({
  __esModule: true,
  default: vi.fn(() => <div data-testid="snackbar">Snackbar</div>)
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

describe('ProfilePage', () => {
  const mockUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    is_staff: false,
    icon: 'test-icon-url',
    major: 'Computer Science',
    is_president: false,
    is_vice_president: false,
    is_event_manager: false
  };

  const mockOtherUser = {
    id: 2,
    name: 'Other User',
    email: 'other@example.com',
    is_staff: false,
    icon: 'other-icon-url',
    is_following: false
  };

  const mockAwards = [
    {
      id: 1,
      award: {
        title: 'Achievement Award',
        description: 'Outstanding performance',
        rank: 'Gold'
      }
    }
  ];

  const theme = createTheme();

  beforeEach(() => {
    vi.resetAllMocks();
    (useAuthStore as any).mockReturnValue({ user: mockUser });
    mockNavigate.mockReset();
  });

  const renderComponent = (initialRoute = '/profile') => {
    return render(
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={[initialRoute]}>
          <Routes>
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/:student_id" element={<ProfilePage />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    );
  };

  it('renders self profile when authenticated', async () => {
    (apiClient.get as any)
      .mockResolvedValueOnce({ data: mockAwards });

    await act(async () => {
      renderComponent();
    });

    expect(screen.getByTestId('profile-header')).toBeInTheDocument();
    expect(screen.getByTestId('profile-static-info')).toBeInTheDocument();
    expect(screen.getByTestId('profile-user-info')).toBeInTheDocument();
    expect(screen.getByTestId('profile-form')).toBeInTheDocument();
    expect(screen.getByTestId('password-form')).toBeInTheDocument();
    expect(screen.getByTestId('award-list')).toBeInTheDocument();
  });

  it('renders other user profile', async () => {
    (apiClient.get as any)
      .mockResolvedValueOnce({ data: mockOtherUser })
      .mockResolvedValueOnce({ data: mockAwards });

    await act(async () => {
      renderComponent('/profile/2');
    });

    expect(screen.getByTestId('profile-header')).toBeInTheDocument();
    expect(screen.getByTestId('profile-static-info')).toBeInTheDocument();
    expect(screen.getByTestId('profile-user-info')).toBeInTheDocument();
    expect(screen.queryByTestId('profile-form')).not.toBeInTheDocument();
    expect(screen.queryByTestId('password-form')).not.toBeInTheDocument();
    expect(screen.getByTestId('award-list')).toBeInTheDocument();
  });

  it('handles staff user profile', async () => {
    const staffUser = { ...mockUser, is_staff: true };
    (useAuthStore as any).mockReturnValue({ user: staffUser });
    (apiClient.get as any)
      .mockResolvedValueOnce({ data: staffUser });

    await act(async () => {
      renderComponent();
    });

    expect(screen.getByTestId('profile-header')).toBeInTheDocument();
    expect(screen.getByTestId('profile-static-info')).toBeInTheDocument();
    expect(screen.queryByTestId('profile-user-info')).not.toBeInTheDocument();
    expect(screen.getByTestId('profile-form')).toBeInTheDocument();
    expect(screen.getByTestId('password-form')).toBeInTheDocument();
    expect(screen.queryByTestId('award-list')).not.toBeInTheDocument();
  });

  it('handles back navigation', async () => {
    await act(async () => {
      renderComponent();
    });

    const backButton = screen.getByText(/back/i);
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('handles API errors gracefully', async () => {
    (apiClient.get as any)
      .mockRejectedValueOnce(new Error('Profile not found'));

    await act(async () => {
      renderComponent('/profile/999');
    });
  });
});