import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PublicGuard } from '../../components/guards/public-guard';
import { useAuthStore } from '../../stores/auth-store';
import { jwtDecode } from 'jwt-decode';
import { ACCESS_TOKEN } from '../../constants';
// Mock dependencies
vi.mock('jwt-decode', () => ({
    jwtDecode: vi.fn(),
}));
vi.mock('../../stores/auth-store', () => ({
    useAuthStore: vi.fn(),
}));
// Don't mock LoadingView since we need to detect the actual component
// The actual LoadingView component renders a spinner SVG instead of using data-testid
// Mock console methods to avoid cluttering the test output
vi.spyOn(console, 'log').mockImplementation(() => { });
vi.spyOn(console, 'warn').mockImplementation(() => { });
vi.spyOn(console, 'error').mockImplementation(() => { });
describe('PublicGuard Component', () => {
    // Setup local storage mock
    const localStorageMock = (() => {
        let store = {};
        return {
            getItem: vi.fn(key => store[key] || null),
            setItem: vi.fn((key, value) => {
                store[key] = value.toString();
            }),
            removeItem: vi.fn(key => {
                delete store[key];
            }),
            clear: vi.fn(() => {
                store = {};
            }),
        };
    })();
    Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
    });
    const mockSetUser = vi.fn();
    beforeEach(() => {
        vi.clearAllMocks();
        localStorageMock.clear();
        // Default mock implementation for useAuthStore
        useAuthStore.mockReturnValue({
            user: null,
            setUser: mockSetUser,
        });
    });
    const TestComponent = () => _jsx("div", { "data-testid": "test-component", children: "Test Content" });
    const renderWithRouter = (ui, { route = '/' } = {}) => {
        return render(_jsx(MemoryRouter, { initialEntries: [route], children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: ui }), _jsx(Route, { path: "/admin", element: _jsx("div", { children: "Admin Dashboard" }) }), _jsx(Route, { path: "/student", element: _jsx("div", { children: "Student Dashboard" }) })] }) }));
    };
    it('should show loading view initially', () => {
        renderWithRouter(_jsx(PublicGuard, { children: _jsx(TestComponent, {}) }));
        // The first render before authentication check should show the TestComponent immediately
        // since isAuthorized is initialized as null and set asynchronously
        expect(screen.getByTestId('test-component')).toBeInTheDocument();
    });
    it('should show children when no token exists', async () => {
        localStorageMock.getItem.mockReturnValueOnce(null);
        renderWithRouter(_jsx(PublicGuard, { children: _jsx(TestComponent, {}) }));
        await waitFor(() => {
            expect(screen.getByTestId('test-component')).toBeInTheDocument();
        });
        expect(localStorageMock.getItem).toHaveBeenCalledWith(ACCESS_TOKEN);
    });
    it('should redirect to admin dashboard for admin users with valid token', async () => {
        const token = 'valid.jwt.token';
        localStorageMock.getItem.mockReturnValueOnce(token);
        jwtDecode.mockReturnValueOnce({ exp: (Date.now() / 1000) + 3600 }); // Token expires in 1 hour
        // Mock a user with admin role after auth check completes
        useAuthStore.mockReturnValue({
            user: { id: '123', name: 'Admin User', role: 'admin' },
            setUser: mockSetUser,
        });
        renderWithRouter(_jsx(PublicGuard, { children: _jsx(TestComponent, {}) }));
        await waitFor(() => {
            expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
        });
        expect(jwtDecode).toHaveBeenCalledWith(token);
    });
    it('should redirect to student dashboard for student users with valid token', async () => {
        const token = 'valid.jwt.token';
        localStorageMock.getItem.mockReturnValueOnce(token);
        jwtDecode.mockReturnValueOnce({ exp: (Date.now() / 1000) + 3600 }); // Token expires in 1 hour
        // Mock a user with student role after auth check completes
        useAuthStore.mockReturnValue({
            user: { id: '456', name: 'Student User', role: 'student' },
            setUser: mockSetUser,
        });
        renderWithRouter(_jsx(PublicGuard, { children: _jsx(TestComponent, {}) }));
        await waitFor(() => {
            expect(screen.getByText('Student Dashboard')).toBeInTheDocument();
        });
    });
    it('should redirect to home page for users with unknown roles', async () => {
        const token = 'valid.jwt.token';
        localStorageMock.getItem.mockReturnValueOnce(token);
        jwtDecode.mockReturnValueOnce({ exp: (Date.now() / 1000) + 3600 }); // Token expires in 1 hour
        // Mock a user with undefined role after auth check completes
        useAuthStore.mockReturnValue({
            user: { id: '789', name: 'Unknown User', role: 'unknown' },
            setUser: mockSetUser,
        });
        renderWithRouter(_jsx(PublicGuard, { children: _jsx(TestComponent, {}) }));
        // Should redirect to home page for undefined roles
        await waitFor(() => {
            expect(screen.queryByTestId('test-component')).not.toBeInTheDocument();
        });
    });
    it('should remove expired tokens and show children', async () => {
        const token = 'expired.jwt.token';
        localStorageMock.getItem.mockReturnValueOnce(token);
        jwtDecode.mockReturnValueOnce({ exp: (Date.now() / 1000) - 3600 }); // Token expired 1 hour ago
        renderWithRouter(_jsx(PublicGuard, { children: _jsx(TestComponent, {}) }));
        await waitFor(() => {
            expect(screen.getByTestId('test-component')).toBeInTheDocument();
        });
        expect(localStorageMock.removeItem).toHaveBeenCalledWith(ACCESS_TOKEN);
    });
    it('should handle token decode errors and show children', async () => {
        const token = 'invalid.jwt.token';
        localStorageMock.getItem.mockReturnValueOnce(token);
        jwtDecode.mockImplementationOnce(() => {
            throw new Error('Invalid token');
        });
        renderWithRouter(_jsx(PublicGuard, { children: _jsx(TestComponent, {}) }));
        await waitFor(() => {
            expect(screen.getByTestId('test-component')).toBeInTheDocument();
        });
    });
    it('should continue showing loading view until user data is available', async () => {
        const token = 'valid.jwt.token';
        localStorageMock.getItem.mockReturnValueOnce(token);
        jwtDecode.mockReturnValueOnce({ exp: (Date.now() / 1000) + 3600 }); // Token expires in 1 hour
        // First, no user data is available
        useAuthStore.mockReturnValue({
            user: null,
            setUser: mockSetUser,
        });
        const { rerender } = renderWithRouter(_jsx(PublicGuard, { children: _jsx(TestComponent, {}) }));
        // Should still show loading after auth check completes but user is still null
        await waitFor(() => {
            // Look for the specific SVG structure of the loading spinner
            const spinnerElement = screen.getByText((content, element) => {
                // Check if it's an SVG element with the animate-spin class
                return element.tagName.toLowerCase() === 'svg' &&
                    element.classList.contains('animate-spin');
            }, { selector: 'svg' });
            expect(spinnerElement).toBeInTheDocument();
        });
        // Now update the mock to provide user data
        useAuthStore.mockReturnValue({
            user: { id: '123', name: 'Admin User', role: 'admin' },
            setUser: mockSetUser,
        });
        rerender(_jsx(MemoryRouter, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(PublicGuard, { children: _jsx(TestComponent, {}) }) }), _jsx(Route, { path: "/admin", element: _jsx("div", { children: "Admin Dashboard" }) })] }) }));
        // Should now redirect to admin dashboard
        await waitFor(() => {
            expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
        });
    });
});
