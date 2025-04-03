// /Users/arhamzahid/Projects/large-project/frontend/src/pages/Home/__test__/Profile.test.tsx
import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ProfilePage from '../Profile';
import { apiClient, apiPaths } from '../../../api';
import { useAuthStore } from '../../../stores/auth-store';
import { User } from '../../../types/user/user';
import { AwardAssignment } from '../../../types/student/award';

const theme = createTheme({ palette: { mode: 'light' } });
const darkTheme = createTheme({ palette: { mode: 'dark' } });

vi.mock('../../../components/profile/ProfileHeader', () => ({
    default: ({ profile, isSelf, isFollowing, onToggleFollow, onAvatarUpdated, setSnackbarData }) => (
        <div data-testid="profile-header">
            <h2>{isSelf ? `Welcome back, ${profile?.first_name}!` : `${profile?.first_name}'s Profile`}</h2>
            {!isSelf && profile && (
                <button data-testid="follow-button" onClick={() => onToggleFollow(profile.id)}>
                    {isFollowing ? 'Unfollow' : 'Follow'}
                </button>
            )}
            {isSelf && <button onClick={() => onAvatarUpdated('new-url.jpg')}>Update Avatar</button>}
             {isSelf && <button onClick={() => setSnackbarData({open: true, message: 'Header Action', severity: 'info'})}>Header Action</button>}
        </div>
    )
}));

vi.mock('../../../components/profile/ProfileStaticInfo', () => ({
    default: ({ profile }) => (
        <div data-testid="profile-static-info">
            <span>Username: {profile?.username}</span>
            <span>Email: {profile?.email}</span>
            {profile?.email_verified && <span>Verified</span>}
        </div>
    )
}));

vi.mock('../../../components/profile/ProfileUserInfo', () => ({
    default: ({ major, isPresident, presidentOf }) => (
        <div data-testid="profile-user-info">
            <span>Major: {major || 'N/A'}</span>
            {isPresident && <span>President of: {presidentOf}</span>}
        </div>
    )
}));

vi.mock('../../../components/profile/ProfileForm', () => ({
    default: ({ user, setSnackbarData }) => (
        <form data-testid="profile-form" onSubmit={(e) => {
            e.preventDefault();
            setSnackbarData({ open: true, message: 'Profile updated!', severity: 'success' });
        }}>
            <label htmlFor="firstName">First Name</label>
            <input id="firstName" defaultValue={user?.first_name || ''} />
            <label htmlFor="lastName">Last Name</label>
            <input id="lastName" defaultValue={user?.last_name || ''} />
            <label htmlFor="email">Email</label>
            <input id="email" type="email" defaultValue={user?.email || ''} />
            <button type="submit">Update Profile</button>
        </form>
    )
}));

vi.mock('../../../components/profile/PasswordForm', () => ({
    default: ({ setSnackbarData }) => (
        <div data-testid="password-form">
            <h3>Change Password</h3>
            <button onClick={() => setSnackbarData({ open: true, message: 'Password updated!', severity: 'success' })}>
                Update Password
            </button>
        </div>
    )
}));

vi.mock('../../../components/profile/AwardList', () => ({
    default: ({ awards }) => (
        <div data-testid="awards-list">
            <h3>Awards</h3>
            {awards?.length > 0 ? (
                <ul>
                    {awards.map((a) => (
                        <li key={a.id}>{a.award.title} - {a.award.rank}</li>
                    ))}
                </ul>
            ) : (
                <div>No awards found</div>
            )}
        </div>
    )
}));

vi.mock('../../../components/profile/SnackbarGlobal', () => ({
    default: ({ open, message, severity, onClose }) => (
        <div data-testid="snackbar" data-open={open} data-severity={severity}>
            {open && message}
            {open && <button onClick={onClose}>Close Snackbar</button>}
        </div>
    )
}));


vi.mock('../../../api', async (importOriginal) => {
    const actual = await importOriginal() as any;
    return {
        ...actual,
        apiClient: {
            get: vi.fn(),
            put: vi.fn(),
            post: vi.fn(),
        },
         apiPaths: actual.apiPaths || {
            USER: { BASE: '/api/users' },
            AWARDS: { STUDENTS: '/api/awards/students' },
            VERIFICATION: { REQUEST_OTP: '/api/verification/request-otp' }
         }
    };
});

const mockUser: User = {
    id: 123,
    first_name: 'John',
    last_name: 'Doe',
    username: 'johndoe',
    email: 'john.doe@example.com',
    is_staff: false,
    is_active: true,
    icon: 'avatar.jpg',
    major: 'Computer Science',
    is_president: false,
    is_vice_president: false,
    is_event_manager: false,
    president_of: null,
    vice_president_of_society: null,
    event_manager_of_society: null,
    email_verified: true,
};

let currentAuthStoreState: { user: User | null } = { user: mockUser };

vi.mock('../../../stores/auth-store', () => ({
    useAuthStore: vi.fn(() => currentAuthStoreState),
}));

const mockAwards: AwardAssignment[] = [
    { id: 1, award: { id: 101, title: 'Outstanding Achievement', description: 'Exceptional work', rank: 'Gold' }, student: 123, awarded_by: 1, awarded_date: '2024-01-01' },
    { id: 2, award: { id: 102, title: 'Excellence Award', description: 'Great performance', rank: 'Silver' }, student: 123, awarded_by: 1, awarded_date: '2024-02-01' }
];

const mockOtherUserAwards: AwardAssignment[] = [
     { id: 3, award: { id: 103, title: 'Top Project', description: 'Best project', rank: 'Bronze' }, student: 456, awarded_by: 1, awarded_date: '2024-03-01' }
];

const mockNavigate = vi.fn();
let mockParams = {};

vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal() as any;
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useParams: () => mockParams,
    };
});

describe('ProfilePage Component', () => {

    const renderProfilePage = (initialEntries = ['/profile'], useDark = false) => {
        return render(
            <ThemeProvider theme={useDark ? darkTheme : theme}>
                <MemoryRouter initialEntries={initialEntries}>
                    <Routes>
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/profile/:student_id" element={<ProfilePage />} />
                    </Routes>
                </MemoryRouter>
            </ThemeProvider>
        );
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockParams = {};
        currentAuthStoreState = { user: mockUser };
        vi.mocked(useAuthStore).mockImplementation(() => currentAuthStoreState);

        vi.mocked(apiClient.get).mockImplementation(async (url: string) => {
            if (url.startsWith(`${apiPaths.USER.BASE}/`)) {
                 const id = url.split('/').pop();
                 if (id === '456') {
                    const otherUser: User = {
                        id: 456, first_name: 'Jane', last_name: 'Smith', username: 'janesmith', email: 'jane.smith@example.com', is_staff: false, is_active: true, icon: 'jane.png', major: 'Physics', is_president: true, president_of: 'Physics Society', is_vice_president: false, vice_president_of_society: null, is_event_manager: false, event_manager_of_society: null, email_verified: true,
                        is_following: false,
                    };
                    return { data: otherUser };
                 } else if (id === '999') {
                     throw new Error('User not found');
                 } else if (id === 'undefined' || !id) {
                    throw new Error('User ID is undefined');
                 }
            }
             else if (currentAuthStoreState.user && url === `/api/awards/students/${currentAuthStoreState.user.id}`) {
                 if (currentAuthStoreState.user.is_staff) {
                     return { data: [] };
                 } else {
                     return { data: mockAwards };
                 }
             }
            else if (url === `/api/awards/students/456`) {
                 return { data: mockOtherUserAwards };
            }
             else if (url === `/api/awards/students/999`) {
                 return { data: [] };
             }

            console.error(`Unhandled GET request in mock: ${url}`);
            throw new Error(`Unhandled GET request: ${url}`);
        });

        const mockApiState = { following: {} as Record<number, boolean> };
         vi.mocked(apiClient.post).mockImplementation(async (url: string, data?: any) => {
            if (url.match(/\/api\/users\/(\d+)\/follow/)) {
                const userId = Number(url.match(/\/api\/users\/(\d+)\/follow/)?.[1]);
                const isCurrentlyFollowing = mockApiState.following[userId] || false;
                const message = isCurrentlyFollowing ? "Unfollowed successfully." : "Followed successfully.";
                mockApiState.following[userId] = !isCurrentlyFollowing;
                return { data: { message } };
            }
             if (url === "/api/verification/request-otp") { return { data: { message: "OTP sent" } }; }
             console.error(`Unhandled POST request in mock: ${url}`);
             throw new Error(`Unhandled POST request: ${url}`);
        });
        vi.mocked(apiClient.put).mockResolvedValue({ data: { message: 'Profile updated successfully' } });
    });


    it('does not render profile content when viewing self profile path and user is null (initial load)', async () => {
        currentAuthStoreState = { user: null };
        vi.mocked(useAuthStore).mockImplementation(() => currentAuthStoreState);

        renderProfilePage(['/profile']);

        expect(screen.queryByText(/Loading user info.../i)).not.toBeInTheDocument();

        await waitFor(() => {
            expect(screen.queryByTestId('profile-header')).not.toBeInTheDocument();
            expect(screen.queryByTestId('profile-static-info')).not.toBeInTheDocument();
            expect(screen.queryByTestId('profile-form')).not.toBeInTheDocument();
            expect(screen.queryByTestId('awards-list')).not.toBeInTheDocument();
        });

        expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });


    it('fetches and displays own profile (non-staff) correctly', async () => {
        renderProfilePage(['/profile']);
        expect(await screen.findByText(`Welcome back, ${mockUser.first_name}!`)).toBeInTheDocument();
        expect(screen.getByTestId('profile-static-info')).toHaveTextContent(`Username: ${mockUser.username}`);
        expect(screen.getByTestId('profile-user-info')).toBeInTheDocument();
        expect(screen.getByTestId('profile-user-info')).toHaveTextContent(`Major: ${mockUser.major}`);
        expect(screen.getByTestId('profile-form')).toBeInTheDocument();
        expect(screen.getByTestId('password-form')).toBeInTheDocument();
        const awardList = await screen.findByTestId('awards-list');
        expect(awardList).toBeInTheDocument();
        expect(awardList).toHaveTextContent(mockAwards[0].award.title);
    });

     it('renders correctly in dark theme', async () => {
        renderProfilePage(['/profile'], true);
        expect(await screen.findByText(`Welcome back, ${mockUser.first_name}!`)).toBeInTheDocument();
        expect(screen.getByTestId('profile-static-info')).toBeInTheDocument();
    });

    it('fetches and displays another user\'s profile (non-staff) correctly', async () => {
         mockParams = { student_id: '456' };
         renderProfilePage([`/profile/456`]);
         expect(await screen.findByText(`Jane's Profile`)).toBeInTheDocument();
         expect(screen.getByTestId('profile-static-info')).toHaveTextContent(`Username: janesmith`);
         const userInfo = screen.getByTestId('profile-user-info');
         expect(userInfo).toHaveTextContent('Major: Physics');
         expect(userInfo).toHaveTextContent('President of: Physics Society');
         expect(screen.queryByTestId('profile-form')).not.toBeInTheDocument();
         expect(screen.getByTestId('follow-button')).toHaveTextContent('Follow');
         const awardList = await screen.findByTestId('awards-list');
         expect(awardList).toBeInTheDocument();
         expect(awardList).toHaveTextContent(mockOtherUserAwards[0].award.title);
    });

     it('handles toggling follow status for another user', async () => {
         mockParams = { student_id: '456' };
         const userId = 456;
         const mockApiState = { following: { [userId]: false } };

         vi.mocked(apiClient.post).mockImplementation(async (url: string) => {
             if (url === `/api/users/${userId}/follow`) {
                const isCurrentlyFollowing = mockApiState.following[userId];
                const message = isCurrentlyFollowing ? "Unfollowed successfully." : "Followed successfully.";
                mockApiState.following[userId] = !isCurrentlyFollowing;
                return { data: { message } };
             }
             throw new Error(`Unhandled POST in follow test: ${url}`);
         });

        renderProfilePage([`/profile/456`]);

        const followButton = await screen.findByTestId('follow-button');
        expect(followButton).toHaveTextContent('Follow');

        fireEvent.click(followButton);
        await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith(`/api/users/${userId}/follow`));
        await waitFor(() => expect(screen.getByTestId('follow-button')).toHaveTextContent('Unfollow'));

        fireEvent.click(screen.getByTestId('follow-button'));
        await waitFor(() => expect(apiClient.post).toHaveBeenCalledTimes(2));
        await waitFor(() => expect(screen.getByTestId('follow-button')).toHaveTextContent('Follow'));

    });

    it('navigates back when back button is clicked', async () => {
        renderProfilePage(['/profile']);
        const backButton = await screen.findByRole('button', { name: /back/i });
        fireEvent.click(backButton);
        expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

     it('handles API error when fetching another user profile', async () => {
        mockParams = { student_id: '999' };
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        renderProfilePage([`/profile/999`]);
        await waitFor(() => {
            expect(screen.queryByTestId('profile-header')).not.toBeInTheDocument();
            expect(screen.queryByTestId('profile-static-info')).not.toBeInTheDocument();
        });
        expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
        consoleErrorSpy.mockRestore();
    });

    it('submits profile form and shows snackbar on self profile', async () => {
        renderProfilePage(['/profile']);
        const form = await screen.findByTestId('profile-form');

        await act(async () => { fireEvent.submit(form); });

        const snackbar = await screen.findByTestId('snackbar');
        expect(snackbar).toHaveAttribute('data-open', 'true');
        expect(snackbar).toHaveTextContent('Profile updated!');
        const closeButton = screen.getByRole('button', { name: /close snackbar/i });
        await act(async () => { fireEvent.click(closeButton); });
        expect(snackbar).toHaveAttribute('data-open', 'false');
    });

     it('does not render user info or awards list for a staff user profile', async () => {
        currentAuthStoreState = {
            user: { ...mockUser, id: 789, username: 'staffuser', is_staff: true }
        };
         vi.mocked(useAuthStore).mockImplementation(() => currentAuthStoreState);

        renderProfilePage(['/profile']);
        expect(await screen.findByText(`Welcome back, ${currentAuthStoreState.user.first_name}!`)).toBeInTheDocument();
        expect(screen.getByTestId('profile-static-info')).toHaveTextContent(`Username: ${currentAuthStoreState.user.username}`);
        expect(screen.queryByTestId('profile-user-info')).not.toBeInTheDocument();
        await waitFor(() => {
            expect(screen.queryByTestId('awards-list')).not.toBeInTheDocument();
        });
        expect(screen.getByTestId('profile-form')).toBeInTheDocument();
        expect(screen.getByTestId('password-form')).toBeInTheDocument();
     });
});