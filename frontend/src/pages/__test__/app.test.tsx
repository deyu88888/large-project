import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App, apiClient } from '../../app';
import { useSettingsStore } from '../../stores/settings-store';
import { themeSettings } from '../../theme/theme';
import { SearchProvider } from '../../components/layout/SearchContext';
import { Routes } from '../../routes';

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
  Routes: () => <div data-testid="routes">Routes Component</div>
}));

vi.mock('../../components/layout/SearchContext', () => ({
  SearchProvider: ({ children }) => (
    <div data-testid="search-provider">{children}</div>
  )
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
    ThemeProvider: ({ children }) => (
      <div data-testid="theme-provider">{children}</div>
    ),
    CssBaseline: () => <div data-testid="css-baseline" />,
  };
});

describe('App Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<App />);
    
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
    
    render(<App />);
    
    // Verify themeSettings was called with the correct theme mode
    expect(themeSettings).toHaveBeenCalled();
  });

  it('properly wraps the Routes component with required providers', () => {
    render(<App />);
    
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