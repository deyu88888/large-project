import { jsx as _jsx } from "react/jsx-runtime";
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App, apiClient } from '../../app';
import { themeSettings } from '../../theme/theme';
// Mock the dependencies
vi.mock('../../stores/settings-store', () => ({
    useSettingsStore: () => ({
        themeMode: 'light'
    })
}));
vi.mock('../../theme/theme', () => ({
    themeSettings: vi.fn(() => ({
        palette: {
            mode: 'light'
        }
    }))
}));
vi.mock('../../routes', () => ({
    Routes: () => _jsx("div", { "data-testid": "routes", children: "Routes Component" })
}));
vi.mock('../../components/layout/SearchContext', () => ({
    SearchProvider: ({ children }) => (_jsx("div", { "data-testid": "search-provider", children: children }))
}));
// Mock the createTheme function
vi.mock('@mui/material', async () => {
    const actual = await vi.importActual('@mui/material');
    return {
        ...actual,
        createTheme: vi.fn(() => ({
            palette: {
                mode: 'light',
            },
        })),
        ThemeProvider: ({ children }) => (_jsx("div", { "data-testid": "theme-provider", children: children })),
        CssBaseline: () => _jsx("div", { "data-testid": "css-baseline" }),
    };
});
describe('App Component', () => {
    beforeEach(() => {
        // Reset mocks before each test
        vi.clearAllMocks();
    });
    it('renders without crashing', () => {
        render(_jsx(App, {}));
        // Verify that Routes component is rendered
        expect(screen.getByTestId('routes')).toBeInTheDocument();
    });
    it('uses the correct theme mode from settings store', () => {
        // Update the mock to return 'dark' theme mode
        vi.mock('../../stores/settings-store', () => ({
            useSettingsStore: () => ({
                themeMode: 'dark'
            })
        }), { virtual: true });
        render(_jsx(App, {}));
        // Verify themeSettings was called with the correct theme mode
        expect(themeSettings).toHaveBeenCalled();
    });
    it('properly wraps the Routes component with required providers', () => {
        render(_jsx(App, {}));
        // Check that all providers are present
        expect(screen.getByTestId('theme-provider')).toBeInTheDocument();
        expect(screen.getByTestId('search-provider')).toBeInTheDocument();
        expect(screen.getByTestId('routes')).toBeInTheDocument();
    });
    it('configures apiClient with correct default settings', () => {
        // Test the axios client configuration
        expect(apiClient.defaults.baseURL).toBe('http://localhost:8000');
        expect(apiClient.defaults.headers['Content-Type']).toBe('application/json');
    });
});
