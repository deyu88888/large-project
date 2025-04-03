// /Users/arhamzahid/Projects/large-project/frontend/src/pages/Home/__test__/app.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mock Dependencies BEFORE importing App ---

// Mock Stores
vi.mock('../../../stores/settings-store', () => ({
  useSettingsStore: vi.fn(() => ({ themeMode: 'light' }))
}));

// Mock Theme Setup
vi.mock('../../../theme/theme', () => ({
  themeSettings: vi.fn((mode) => ({ palette: { mode } })) // Return an object reflecting the mode
}));

// Mock Child Components/Providers
vi.mock('../../../routes', () => ({
  Routes: () => <div data-testid="routes">Routes Component</div>
}));

vi.mock('../../../components/layout/SearchContext', () => ({
  SearchProvider: ({ children }) => <div data-testid="search-provider">{children}</div>
}));

vi.mock('../../../context/AuthContext', () => ({
  AuthProvider: ({ children }) => <div data-testid="auth-provider">{children}</div>
}));

// Mock MUI minimally for structure testing
const mockMuiTheme = { mui: 'theme' }; // Simple placeholder object
vi.mock('@mui/material', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    createTheme: vi.fn((themeArgs) => ({ ...mockMuiTheme, args: themeArgs })), // Return placeholder, capture args
    ThemeProvider: ({ children, theme }) => (
        // Render children and add theme prop for inspection if needed
        <div data-testid="theme-provider" data-theme-args={JSON.stringify(theme?.args)}>
          {children}
        </div>
      ),
    CssBaseline: () => <div data-testid="css-baseline" />,
  };
});

// --- Import the Component Under Test and Mocks ---
import { App } from '../../../app'; // Adjust path as necessary
import { useSettingsStore } from '../../../stores/settings-store';
import { themeSettings } from '../../../theme/theme';
import { createTheme } from '@mui/material';

// --- Test Suite ---
describe('App Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    // Ensure default mock state for store
    vi.mocked(useSettingsStore).mockReturnValue({ themeMode: 'light' });
  });

  it('renders all nested providers and the Routes component', () => {
    render(<App />);

    // Check that the core providers/components rendered by App are present
    // These assertions rely on the mocks rendering placeholders with testids
    expect(screen.getByTestId('theme-provider')).toBeInTheDocument();
    expect(screen.getByTestId('css-baseline')).toBeInTheDocument();
    expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
    expect(screen.getByTestId('search-provider')).toBeInTheDocument();

    // Check for the innermost component (mocked Routes)
    expect(screen.getByTestId('routes')).toBeInTheDocument();
    // Note: BrowserRouter itself doesn't render a DOM element with a testid
  });

  it('initializes MUI theme using themeMode from settings store', () => {
    const testMode = 'dark';
    // Override default mock for this test
    vi.mocked(useSettingsStore).mockReturnValue({ themeMode: testMode });

    render(<App />);

    // Verify store hook was called
    expect(useSettingsStore).toHaveBeenCalledTimes(1);

    // Verify themeSettings was called with the correct mode
    expect(themeSettings).toHaveBeenCalledTimes(1);
    expect(themeSettings).toHaveBeenCalledWith(testMode);

    // Verify createTheme was called with the result of themeSettings
    expect(createTheme).toHaveBeenCalledTimes(1);
    // Check the *argument* passed to createTheme matches the *result* of themeSettings
    expect(createTheme).toHaveBeenCalledWith(
        expect.objectContaining({
            palette: { mode: testMode } // This structure comes from the themeSettings mock
        })
    );

    // Optional: Check if ThemeProvider received the theme object created
    // (Requires mock ThemeProvider to expose theme, e.g., via data attribute)
    const themeProvider = screen.getByTestId('theme-provider');
    const themeArgsAttribute = themeProvider.getAttribute('data-theme-args');
    expect(themeArgsAttribute).toBeDefined();
    const passedArgs = JSON.parse(themeArgsAttribute || '{}');
    expect(passedArgs).toEqual(
        expect.objectContaining({
            palette: { mode: testMode }
        })
    );
  });

  // The test for apiClient configuration was removed as it's not the responsibility of App.tsx
});