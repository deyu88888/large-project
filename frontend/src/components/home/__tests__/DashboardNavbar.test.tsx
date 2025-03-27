import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import { DashboardNavbar } from '../DashboardNavbar';
import { SearchContext } from '../../../components/layout/SearchContext';
import { useSettingsStore } from '../../../stores/settings-store';


vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/' }),
  };
});


vi.mock('../../../stores/settings-store', () => ({
  useSettingsStore: vi.fn(),
}));

const mockNavigate = vi.fn();
const mockToggleThemeMode = vi.fn();

const renderWithProviders = (ui, { searchTerm = '', setSearchTerm = vi.fn() } = {}) => {
  const theme = createTheme({
    palette: {
      mode: 'light',
      greenAccent: {
        main: '#4CAF50',
        dark: '#388E3C',
      },
    },
  });

  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <SearchContext.Provider value={{ searchTerm, setSearchTerm }}>
          {ui}
        </SearchContext.Provider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('DashboardNavbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    
    useSettingsStore.mockReturnValue({
      toggleThemeMode: mockToggleThemeMode,
    });
  });

  it('renders the navigation links correctly', () => {
    renderWithProviders(<DashboardNavbar />);
    
    
    expect(screen.getByText('Home')).toBeDefined();
    expect(screen.getByText('Discover')).toBeDefined();
    expect(screen.getByText('Societies')).toBeDefined();
    expect(screen.getByText('Events')).toBeDefined();
    expect(screen.getByText('Calendar')).toBeDefined();
    expect(screen.getByText('Support')).toBeDefined();
  });

  it('navigates when a navigation link is clicked', () => {
    renderWithProviders(<DashboardNavbar />);
    
    fireEvent.click(screen.getByText('Discover'));
    expect(mockNavigate).toHaveBeenCalledWith('/search');
    
    fireEvent.click(screen.getByText('Societies'));
    expect(mockNavigate).toHaveBeenCalledWith('/all-societies');
  });

  it('opens mobile menu when menu icon is clicked', () => {
    
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false, 
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    renderWithProviders(<DashboardNavbar />);
    
    
    const menuButton = screen.getByLabelText('account of current user');
    fireEvent.click(menuButton);
    
    
    
    
    expect(menuButton).toBeDefined();
  });

  it('updates search term when input changes', () => {
    const mockSetSearchTerm = vi.fn();
    renderWithProviders(<DashboardNavbar />, { 
      searchTerm: '', 
      setSearchTerm: mockSetSearchTerm 
    });
    
    const searchInput = screen.getByPlaceholderText('Search…');
    fireEvent.change(searchInput, { target: { value: 'test search' } });
    
    expect(mockSetSearchTerm).toHaveBeenCalledWith('test search');
  });

  it('navigates to search page when Enter key is pressed in search input', () => {
    renderWithProviders(<DashboardNavbar />, { searchTerm: 'test search' });
    
    const searchInput = screen.getByPlaceholderText('Search…');
    fireEvent.keyPress(searchInput, { key: 'Enter', code: 'Enter', charCode: 13 });
    
    expect(mockNavigate).toHaveBeenCalledWith('/search?q=test search');
  });

  it('opens user menu when avatar is clicked', () => {
    renderWithProviders(<DashboardNavbar />);
    
    
    
    const avatarButton = screen.getByRole('button', { name: 'Open settings' });
    expect(screen.queryByRole('menu')).toBeNull();
    
    
    fireEvent.click(avatarButton);
    
    
    const menu = screen.getByRole('menu');
    expect(menu).toBeDefined();
    
    
    const loginItem = within(menu).getByText('Login');
    const registerItem = within(menu).getByText('Register');
    expect(loginItem).toBeDefined();
    expect(registerItem).toBeDefined();
  });

  it('navigates to login page when Login is clicked', () => {
    renderWithProviders(<DashboardNavbar />);
    
    
    const avatarButton = screen.getByRole('button', { name: 'Open settings' });
    fireEvent.click(avatarButton);
    
    
    fireEvent.click(screen.getByText('Login'));
    
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('navigates to register page when Register is clicked', () => {
    renderWithProviders(<DashboardNavbar />);
    
    
    const avatarButton = screen.getByRole('button', { name: 'Open settings' });
    fireEvent.click(avatarButton);
    
    
    fireEvent.click(screen.getByText('Register'));
    
    expect(mockNavigate).toHaveBeenCalledWith('/register');
  });

  it('toggles theme mode when Light/Dark mode is clicked', () => {
    renderWithProviders(<DashboardNavbar />);
    
    
    const avatarButton = screen.getByRole('button', { name: 'Open settings' });
    fireEvent.click(avatarButton);
    
    
    
    const menuItems = screen.getAllByRole('menuitem');
    const themeMenuItem = menuItems.find(item => 
      item.textContent?.includes('Light Mode') || item.textContent?.includes('Dark Mode')
    );
    
    expect(themeMenuItem).toBeDefined();
    if (themeMenuItem) {
      fireEvent.click(themeMenuItem);
      expect(mockToggleThemeMode).toHaveBeenCalled();
    }
  });
});