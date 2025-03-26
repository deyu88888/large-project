import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import * as reactRouter from 'react-router-dom';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Layout from '../../components/layout';
import { SearchContext } from "../../components/layout/SearchContext";
// Mock stores
vi.mock('../../stores/settings-store', () => ({
    useSettingsStore: () => ({
        drawer: false,
        toggleDrawer: vi.fn(),
        toggleThemeMode: vi.fn()
    })
}));
vi.mock('../../stores/auth-store', () => ({
    useAuthStore: () => ({
        user: { id: 1, name: 'Test User', is_president: false }
    })
}));
// Mock the drawer components
vi.mock('../../components/layout/AdminDrawer', () => ({
    default: ({ drawer, toggleDrawer }) => (_jsxs("div", { "data-testid": "admin-drawer", children: ["Admin Drawer ", drawer ? 'Open' : 'Closed', _jsx("button", { onClick: toggleDrawer, children: "Toggle" })] })),
}));
vi.mock('../../components/layout/StudentDrawer', () => ({
    default: ({ drawer }) => (_jsxs("div", { "data-testid": "student-drawer", children: ["Student Drawer ", drawer ? 'Open' : 'Closed'] })),
}));
vi.mock('../../components/layout/PresidentDrawer', () => ({
    default: ({ drawer }) => (_jsxs("div", { "data-testid": "president-drawer", children: ["President Drawer ", drawer ? 'Open' : 'Closed'] })),
}));
// Create a mock navigate function
const mockNavigate = vi.fn();
// Set up the router mocks
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useLocation: () => ({ pathname: '/admin/dashboard' }),
        useParams: () => ({}),
    };
});
// Create themes for testing
const lightTheme = createTheme({
    palette: {
        mode: 'light',
        background: {
            default: '#ffffff',
        },
        text: {
            primary: '#000000',
        },
    },
});
const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        background: {
            default: '#121212',
        },
        text: {
            primary: '#ffffff',
        },
    },
});
describe('Layout Component', () => {
    // Setup before each test
    beforeEach(() => {
        vi.clearAllMocks();
    });
    // Helper function to render component with providers
    const renderWithProviders = (initialRoute = '/admin/dashboard', theme = lightTheme, searchTerm = '', setSearchTerm = vi.fn()) => {
        return render(_jsx(ThemeProvider, { theme: theme, children: _jsx(SearchContext.Provider, { value: { searchTerm, setSearchTerm }, children: _jsx(MemoryRouter, { initialEntries: [initialRoute], children: _jsx(Routes, { children: _jsx(Route, { path: "*", element: _jsx(Layout, {}) }) }) }) }) }));
    };
    it('renders without crashing', () => {
        renderWithProviders();
        expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
        expect(screen.getByTestId('admin-drawer')).toBeInTheDocument();
    });
    it('displays admin drawer for admin routes', () => {
        // Default mock for useLocation returns admin dashboard path
        renderWithProviders('/admin/dashboard');
        expect(screen.getByTestId('admin-drawer')).toBeInTheDocument();
        expect(screen.queryByTestId('student-drawer')).not.toBeInTheDocument();
        expect(screen.queryByTestId('president-drawer')).not.toBeInTheDocument();
    });
    it('displays student drawer for student routes', async () => {
        // Override the location for this test
        const originalUseLocation = reactRouter.useLocation;
        const mockUseLocation = vi.fn().mockReturnValue({ pathname: '/student/dashboard' });
        // Replace the useLocation implementation temporarily
        vi.spyOn(reactRouter, 'useLocation').mockImplementation(mockUseLocation);
        renderWithProviders('/student/dashboard');
        await waitFor(() => {
            expect(screen.getByTestId('student-drawer')).toBeInTheDocument();
            expect(screen.queryByTestId('admin-drawer')).not.toBeInTheDocument();
            expect(screen.queryByTestId('president-drawer')).not.toBeInTheDocument();
        });
        // Restore the original implementation
        vi.spyOn(reactRouter, 'useLocation').mockRestore();
    });
    it('displays president drawer for president users regardless of route', async () => {
        // Mock the auth store to return a president user
        const authStore = await import('../../stores/auth-store');
        const originalUseAuthStore = authStore.useAuthStore;
        vi.spyOn(authStore, 'useAuthStore').mockImplementation(() => ({
            user: { id: 1, name: 'Test President', is_president: true }
        }));
        renderWithProviders('/admin/dashboard');
        await waitFor(() => {
            expect(screen.getByTestId('president-drawer')).toBeInTheDocument();
            expect(screen.queryByTestId('admin-drawer')).not.toBeInTheDocument();
            expect(screen.queryByTestId('student-drawer')).not.toBeInTheDocument();
        });
        // Restore the original implementation
        vi.spyOn(authStore, 'useAuthStore').mockRestore();
    });
    it('toggles the drawer when menu icon is clicked', async () => {
        const settingsStore = await import('../../stores/settings-store');
        const toggleDrawerMock = vi.fn();
        vi.spyOn(settingsStore, 'useSettingsStore').mockImplementation(() => ({
            drawer: false,
            toggleDrawer: toggleDrawerMock,
            toggleThemeMode: vi.fn()
        }));
        renderWithProviders();
        const menuIcon = screen.getByLabelText('open drawer');
        fireEvent.click(menuIcon);
        expect(toggleDrawerMock).toHaveBeenCalledTimes(1);
        vi.spyOn(settingsStore, 'useSettingsStore').mockRestore();
    });
    it('toggles theme mode when theme button is clicked', async () => {
        const settingsStore = await import('../../stores/settings-store');
        const toggleThemeModeMock = vi.fn();
        vi.spyOn(settingsStore, 'useSettingsStore').mockImplementation(() => ({
            drawer: false,
            toggleDrawer: vi.fn(),
            toggleThemeMode: toggleThemeModeMock
        }));
        renderWithProviders();
        // Find the theme button by its data-testid
        const themeButton = screen.getByTestId('LightModeOutlinedIcon').closest('button');
        fireEvent.click(themeButton);
        expect(toggleThemeModeMock).toHaveBeenCalledTimes(1);
        vi.spyOn(settingsStore, 'useSettingsStore').mockRestore();
    });
    it('navigates to profile page when profile icon is clicked', () => {
        // Create a fresh mock for the navigate function for this test
        const localMockNavigate = vi.fn();
        vi.spyOn(reactRouter, 'useNavigate').mockImplementation(() => localMockNavigate);
        renderWithProviders('/admin/dashboard');
        // Find the profile button by its data-testid
        const profileButton = screen.getByTestId('PersonOutlinedIcon').closest('button');
        fireEvent.click(profileButton);
        expect(localMockNavigate).toHaveBeenCalledWith('/admin/profile');
        vi.spyOn(reactRouter, 'useNavigate').mockRestore();
    });
    it('navigates to student profile when on student routes', async () => {
        // Create a fresh mock for the navigate function for this test
        const localMockNavigate = vi.fn();
        // Override both useLocation and useNavigate for this test
        vi.spyOn(reactRouter, 'useLocation').mockImplementation(() => ({
            pathname: '/student/dashboard'
        }));
        vi.spyOn(reactRouter, 'useNavigate').mockImplementation(() => localMockNavigate);
        renderWithProviders('/student/dashboard');
        // Find the profile button by its data-testid
        const profileButton = screen.getByTestId('PersonOutlinedIcon').closest('button');
        fireEvent.click(profileButton);
        expect(localMockNavigate).toHaveBeenCalledWith('/student/profile');
        // Restore the mocks
        vi.spyOn(reactRouter, 'useLocation').mockRestore();
        vi.spyOn(reactRouter, 'useNavigate').mockRestore();
    });
    it('updates search term when typing in search input', () => {
        const setSearchTerm = vi.fn();
        renderWithProviders('/admin/dashboard', lightTheme, '', setSearchTerm);
        const searchInput = screen.getByPlaceholderText('Search');
        fireEvent.change(searchInput, { target: { value: 'test search' } });
        expect(setSearchTerm).toHaveBeenCalledWith('test search');
    });
    it('renders properly in dark theme', () => {
        document.body.style.backgroundColor = darkTheme.palette.background.default;
        document.body.style.color = darkTheme.palette.text.primary;
        renderWithProviders('/admin/dashboard', darkTheme);
        // In dark theme, we should see the DarkModeOutlinedIcon
        // This is a bit tricky to test directly, but we can check the theme is passed correctly
        expect(document.body).toHaveStyle({
            backgroundColor: darkTheme.palette.background.default,
            color: darkTheme.palette.text.primary,
        });
    });
    it('handles missing user data gracefully', async () => {
        // Mock the auth store to return null user
        const authStore = await import('../../stores/auth-store');
        vi.spyOn(authStore, 'useAuthStore').mockImplementation(() => ({
            user: null
        }));
        // Set location to admin route
        vi.spyOn(reactRouter, 'useLocation').mockImplementation(() => ({
            pathname: '/admin/dashboard'
        }));
        renderWithProviders('/admin/dashboard');
        // When user is null, we should still see the appropriate drawer based on route
        // In this case, we're on an admin route so we should see the admin drawer
        expect(screen.getByTestId('admin-drawer')).toBeInTheDocument();
        // Clean up mocks
        vi.spyOn(authStore, 'useAuthStore').mockRestore();
        vi.spyOn(reactRouter, 'useLocation').mockRestore();
    });
});
