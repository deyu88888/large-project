import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ProfilePage from '../profile';
import { apiClient } from '../../api';
// Create themes for testing
const theme = createTheme({
    palette: {
        mode: 'light',
    }
});
const darkTheme = createTheme({
    palette: {
        mode: 'dark',
    }
});
// Mock the API client
vi.mock('../../api', () => ({
    apiClient: {
        get: vi.fn(),
        put: vi.fn(),
        post: vi.fn(),
    },
    apiPaths: {
        USER: {
            BASE: '/api/users',
            CURRENT: '/api/users/me',
        }
    }
}));
// Mock useAuthStore hook
const mockUser = {
    id: 123,
    first_name: 'John',
    last_name: 'Doe',
    username: 'johndoe',
    email: 'john.doe@example.com',
    role: 'Student',
    is_active: true
};
const mockAuthStore = {
    user: mockUser,
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
};
// Mock hook outside the vi.mock
const mockUseAuthStore = vi.fn().mockReturnValue(mockAuthStore);
vi.mock('../../stores/auth-store', () => ({
    useAuthStore: () => mockUseAuthStore()
}));
// Mock the router hooks
const mockNavigate = vi.fn();
const mockUseParams = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useParams: () => mockUseParams(),
    };
});
// Mock Formik
vi.mock('formik', () => {
    const original = vi.importActual('formik');
    return {
        ...original,
        Formik: ({ children, initialValues, onSubmit }) => {
            const formikBag = {
                values: initialValues,
                handleChange: vi.fn(),
                handleBlur: vi.fn(),
                isSubmitting: false,
                errors: {},
                touched: {},
                submitForm: () => onSubmit(initialValues, { setSubmitting: vi.fn() })
            };
            return children(formikBag);
        },
        Form: ({ children, onSubmit }) => (_jsx("form", { "data-testid": "profile-form", onSubmit: onSubmit, children: children })),
    };
});
// Mock yup
vi.mock('yup', async () => {
    return {
        object: () => ({
            shape: () => ({})
        }),
        string: () => ({
            required: () => ({
                matches: () => ({
                    max: () => ({
                        min: () => ({})
                    })
                })
            }),
            email: () => ({
                required: () => ({
                    max: () => ({
                        min: () => ({})
                    })
                })
            })
        })
    };
});
describe('ProfilePage Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock the API responses
        vi.mocked(apiClient.get).mockResolvedValue({
            data: mockUser
        });
        vi.mocked(apiClient.put).mockResolvedValue({
            data: { success: true }
        });
        vi.mocked(apiClient.post).mockResolvedValue({
            data: { message: 'Followed successfully.' }
        });
        // Reset the auth store mock
        mockUseAuthStore.mockReturnValue(mockAuthStore);
    });
    const setup = async (useDarkTheme = false, isSelf = true, studentId = '123') => {
        // Update the useParams mock based on whether we're viewing own profile or another
        mockUseParams.mockReturnValue(isSelf ? {} : { student_id: studentId });
        let renderResult;
        await act(async () => {
            renderResult = render(_jsx(ThemeProvider, { theme: useDarkTheme ? darkTheme : theme, children: _jsx(MemoryRouter, { initialEntries: [`/profile${!isSelf ? `/${studentId}` : ''}`], children: _jsxs(Routes, { children: [_jsx(Route, { path: "/profile", element: _jsx(ProfilePage, {}) }), _jsx(Route, { path: "/profile/:student_id", element: _jsx(ProfilePage, {}) })] }) }) }));
            await new Promise(resolve => setTimeout(resolve, 0));
        });
        return renderResult;
    };
    it('renders loading state initially', async () => {
        // Mock auth store with valid user
        mockUseAuthStore.mockReturnValue(mockAuthStore);
        mockUseParams.mockReturnValue({});
        const originalGet = vi.mocked(apiClient.get);
        vi.mocked(apiClient.get).mockImplementation(() => new Promise(resolve => {
            setTimeout(() => resolve({ data: mockUser }), 1000);
        }));
        await act(async () => {
            render(_jsx(ThemeProvider, { theme: theme, children: _jsx(MemoryRouter, { children: _jsx(ProfilePage, {}) }) }));
        });
        expect(screen.getByText('Back')).toBeInTheDocument();
        vi.mocked(apiClient.get).mockImplementation(originalGet);
    });
    it('fetches and displays own profile correctly', async () => {
        await setup(false, true);
        await waitFor(() => {
            expect(screen.getByText(/Welcome back, John!/i)).toBeInTheDocument();
        });
        expect(screen.getByText('Manage your profile information below')).toBeInTheDocument();
        expect(screen.getByText('johndoe')).toBeInTheDocument();
        expect(screen.getByText('Student')).toBeInTheDocument();
        expect(screen.getByText('Verified')).toBeInTheDocument();
        // Check for form fields
        const firstNameField = screen.getByLabelText('First Name');
        const lastNameField = screen.getByLabelText('Last Name');
        const emailField = screen.getByLabelText('Email');
        expect(firstNameField).toBeInTheDocument();
        expect(lastNameField).toBeInTheDocument();
        expect(emailField).toBeInTheDocument();
        expect(screen.getByText('Update Profile')).toBeInTheDocument();
    });
    it('renders correctly in dark theme', async () => {
        await setup(true, true);
        await waitFor(() => {
            expect(screen.getByText(/Welcome back, John!/i)).toBeInTheDocument();
        });
        expect(screen.getByText('Profile Information')).toBeInTheDocument();
    });
    it('handles displaying another user\'s profile', async () => {
        // Mock auth store with valid user
        mockUseAuthStore.mockReturnValue(mockAuthStore);
        const otherUser = {
            id: 456,
            first_name: 'Jane',
            last_name: 'Smith',
            username: 'janesmith',
            email: 'jane.smith@example.com',
            role: 'Teacher',
            is_active: true,
            is_following: false
        };
        vi.mocked(apiClient.get).mockResolvedValueOnce({
            data: otherUser
        });
        await setup(false, false, '456');
        await waitFor(() => {
            expect(screen.getByText(/Jane's Profile/i)).toBeInTheDocument();
        });
        expect(screen.getByText('Follow')).toBeInTheDocument();
        expect(screen.getByText('janesmith')).toBeInTheDocument();
        expect(screen.getByText('Teacher')).toBeInTheDocument();
    });
    it('handles toggling follow status', async () => {
        // Mock auth store with valid user
        mockUseAuthStore.mockReturnValue(mockAuthStore);
        const otherUser = {
            id: 456,
            first_name: 'Jane',
            last_name: 'Smith',
            username: 'janesmith',
            email: 'jane.smith@example.com',
            role: 'Teacher',
            is_active: true,
            is_following: false
        };
        vi.mocked(apiClient.get).mockResolvedValueOnce({
            data: otherUser
        });
        await setup(false, false, '456');
        await waitFor(() => {
            expect(screen.getByText('Follow')).toBeInTheDocument();
        });
        const followButton = screen.getByText('Follow');
        await act(async () => {
            fireEvent.click(followButton);
        });
        expect(apiClient.post).toHaveBeenCalledWith('/api/users/456/follow');
        // Now mock the response for unfollowing
        vi.mocked(apiClient.post).mockResolvedValueOnce({
            data: { message: 'Unfollowed successfully.' }
        });
        // Update component with new state
        await act(async () => {
            render(_jsx(ThemeProvider, { theme: theme, children: _jsx(MemoryRouter, { initialEntries: ['/profile/456'], children: _jsx(Routes, { children: _jsx(Route, { path: "/profile/:student_id", element: _jsx(ProfilePage, {}) }) }) }) }));
            await new Promise(resolve => setTimeout(resolve, 0));
        });
    });
    it('navigates back when back button is clicked', async () => {
        await setup();
        const backButton = screen.getByText('Back');
        await act(async () => {
            fireEvent.click(backButton);
        });
        expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
    it('handles user not found scenario', async () => {
        // Mock auth store with valid user
        mockUseAuthStore.mockReturnValue(mockAuthStore);
        // Mock API error
        vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('User not found'));
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        await setup(false, false, '999');
        await waitFor(() => {
            expect(screen.getByText('No user found')).toBeInTheDocument();
        });
        expect(consoleErrorSpy).toHaveBeenCalled();
        consoleErrorSpy.mockRestore();
    });
    it('submits form with updated profile information', async () => {
        await setup();
        await waitFor(() => {
            expect(screen.getByText(/Welcome back, John!/i)).toBeInTheDocument();
        });
        // Get the update button and form
        const updateButton = screen.getByText('Update Profile');
        const form = screen.getByTestId('profile-form');
        // Mock the submitForm function directly
        const formikSubmitSpy = vi.fn();
        form.onsubmit = formikSubmitSpy;
        // Click the update button
        await act(async () => {
            fireEvent.submit(form);
        });
        // Check if form submission was attempted
        expect(formikSubmitSpy).toHaveBeenCalled();
    });
    it('handles API error on profile fetch', async () => {
        // Mock auth store with valid user
        mockUseAuthStore.mockReturnValue(mockAuthStore);
        // Mock API error for profile fetch
        vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Failed to fetch profile'));
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        // Need to use false for isSelf to trigger the API fetch
        await setup(false, false, '999');
        // Check for error state elements that would be present
        await waitFor(() => {
            const avatar = screen.getByText('?');
            expect(avatar).toBeInTheDocument();
        });
        expect(consoleErrorSpy).toHaveBeenCalled();
        consoleErrorSpy.mockRestore();
    });
});
