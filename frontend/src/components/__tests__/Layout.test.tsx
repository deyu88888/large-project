import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Layout from '../../components/Layout';
import { useSettingsStore } from '../../stores/settings-store';
import { useAuthStore } from '../../stores/auth-store';
import { SearchContext } from '../../components/layout/SearchContext';
import { MemoryRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';

vi.mock('../../stores/settings-store', () => ({
  useSettingsStore: vi.fn()
}));

vi.mock('../../stores/auth-store', () => ({
  useAuthStore: vi.fn()
}));

vi.mock('../../components/layout/AdminDrawer', () => ({
  default: vi.fn(() => <div data-testid="admin-drawer">Admin Drawer</div>)
}));

vi.mock('../../components/layout/StudentDrawer', () => ({
  default: vi.fn(() => <div data-testid="student-drawer">Student Drawer</div>)
}));

vi.mock('../../components/layout/PresidentDrawer', () => ({
  default: vi.fn(() => <div data-testid="president-drawer">President Drawer</div>)
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: vi.fn(),
    useNavigate: vi.fn()
  };
});

const renderLayout = (
  initialPath = '/student', 
  { 
    searchTerm = '', 
    setSearchTerm = vi.fn(),
    drawer = false,
    toggleDrawer = vi.fn(),
    toggleThemeMode = vi.fn(),
    user = { is_president: false }
  } = {}
) => {
  const navigate = vi.fn();
  const location = { pathname: initialPath };
  
  useNavigate.mockReturnValue(navigate);
  useLocation.mockReturnValue(location);
  
  useSettingsStore.mockReturnValue({
    drawer,
    toggleDrawer,
    toggleThemeMode,
  });
  
  useAuthStore.mockReturnValue({
    user,
  });

  const theme = createTheme({
    palette: {
      mode: 'light',
    },
  });

  return {
    ...render(
      <ThemeProvider theme={theme}>
        <SearchContext.Provider value={{ searchTerm, setSearchTerm }}>
          <MemoryRouter initialEntries={[initialPath]}>
            <Routes>
              <Route path="*" element={<Layout />} />
            </Routes>
          </MemoryRouter>
        </SearchContext.Provider>
      </ThemeProvider>
    ),
    navigate,
    toggleDrawer,
    toggleThemeMode,
    setSearchTerm,
  };
};

describe('Layout Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the layout with student drawer when on student path', () => {
    renderLayout('/student');
    expect(screen.getByTestId('student-drawer')).toBeInTheDocument();
  });

  it('renders the layout with admin drawer when on admin path', () => {
    renderLayout('/admin');
    expect(screen.getByTestId('admin-drawer')).toBeInTheDocument();
  });

  it('renders the layout with president drawer when user is president', () => {
    renderLayout('/student', { user: { is_president: true } });
    expect(screen.getByTestId('president-drawer')).toBeInTheDocument();
  });

  it('toggles the drawer when menu icon is clicked', () => {
    const { toggleDrawer } = renderLayout();
    const menuButton = screen.getByLabelText('open drawer');
    
    fireEvent.click(menuButton);
    expect(toggleDrawer).toHaveBeenCalledTimes(1);
  });

  it('toggles theme mode when theme icon is clicked', () => {
    const { toggleThemeMode } = renderLayout();
    const themeButton = screen.getByTestId('LightModeOutlinedIcon').closest('button');
    
    fireEvent.click(themeButton);
    expect(toggleThemeMode).toHaveBeenCalledTimes(1);
  });

  it('navigates to profile when profile icon is clicked from student path', () => {
    const { navigate } = renderLayout('/student');
    const profileButton = screen.getByTestId('PersonOutlinedIcon').closest('button');
    
    fireEvent.click(profileButton);
    expect(navigate).toHaveBeenCalledWith('/student/profile');
  });

  it('navigates to profile when profile icon is clicked from admin path', () => {
    const { navigate } = renderLayout('/admin');
    const profileButton = screen.getByTestId('PersonOutlinedIcon').closest('button');
    
    fireEvent.click(profileButton);
    expect(navigate).toHaveBeenCalledWith('/admin/profile');
  });

  it('navigates to profile when profile icon is clicked from president path', () => {
    const { navigate } = renderLayout('/president');
    const profileButton = screen.getByTestId('PersonOutlinedIcon').closest('button');
    
    fireEvent.click(profileButton);
    expect(navigate).toHaveBeenCalledWith('/student/profile');
  });

  it('navigates to student search when search is performed on student path', () => {
    const { navigate } = renderLayout('/student', { searchTerm: 'test query' });
    const searchButton = screen.getByTestId('SearchIcon').closest('button');
    
    fireEvent.click(searchButton);
    expect(navigate).toHaveBeenCalledWith('/student/student-search?q=test%20query');
  });

  it('updates search term when search is performed on admin path', () => {
    const { setSearchTerm } = renderLayout('/admin', { searchTerm: 'admin query' });
    const searchButton = screen.getByTestId('SearchIcon').closest('button');
    
    fireEvent.click(searchButton);
    expect(setSearchTerm).toHaveBeenCalledWith('admin query');
  });

  it('performs search when Enter key is pressed in search input', () => {
    const { navigate } = renderLayout('/student', { searchTerm: 'enter test' });
    const searchInput = screen.getByPlaceholderText('Search');
    
    fireEvent.keyDown(searchInput, { key: 'Enter' });
    expect(navigate).toHaveBeenCalledWith('/student/student-search?q=enter%20test');
  });

  it('does not navigate when search term is empty', () => {
    const { navigate } = renderLayout('/student', { searchTerm: '  ' });
    const searchButton = screen.getByTestId('SearchIcon').closest('button');
    
    fireEvent.click(searchButton);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('updates search term when input value changes', () => {
    const { setSearchTerm } = renderLayout();
    const searchInput = screen.getByPlaceholderText('Search');
    
    fireEvent.change(searchInput, { target: { value: 'new search' } });
    expect(setSearchTerm).toHaveBeenCalledWith('new search');
  });
});