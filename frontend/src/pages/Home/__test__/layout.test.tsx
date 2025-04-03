import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import * as settingsStore from '../../../stores/settings-store';
import * as authStore from '../../../stores/auth-store';
import { MemoryRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Layout from '../../../components/layout';
import { SearchContext } from "../../../components/layout/SearchContext";

const mockToggleDrawer = vi.fn();
const mockToggleThemeMode = vi.fn();
vi.mock('../../../stores/settings-store', () => ({
  useSettingsStore: vi.fn(() => ({
    drawer: false,
    toggleDrawer: mockToggleDrawer,
    toggleThemeMode: mockToggleThemeMode
  }))
}));

const mockUser = { id: 1, name: 'Test User', is_president: false };
vi.mock('../../../stores/auth-store', () => ({
  useAuthStore: vi.fn(() => ({ user: mockUser }))
}));

vi.mock('../../../components/layout/AdminDrawer', () => ({
  default: ({ drawer }: { drawer: boolean }) => (<div data-testid="admin-drawer">Admin Drawer {drawer ? 'Open' : 'Closed'}</div>),
}));
vi.mock('../../../components/layout/StudentDrawer', () => ({
  default: ({ drawer }: { drawer: boolean }) => (<div data-testid="student-drawer">Student Drawer {drawer ? 'Open' : 'Closed'}</div>),
}));
vi.mock('../../../components/layout/PresidentDrawer', () => ({
  default: ({ drawer }: { drawer: boolean }) => (<div data-testid="president-drawer">President Drawer {drawer ? 'Open' : 'Closed'}</div>),
}));

vi.mock('../../../components/layout/CustomDrawer', () => ({
  CustomAppBar: ({ children, open, sx, ...props }: { children: React.ReactNode, open: boolean, sx?: any, [key: string]: any }) => (
    <div data-testid="custom-app-bar" data-open={String(open)} style={sx}><header {...props}>{children}</header></div>
  ),
}));

const mockNavigate = vi.fn();
const mockUseLocation = vi.fn(() => ({ pathname: '/admin/dashboard' }));
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockUseLocation(),
  };
});

const lightTheme = createTheme({
  palette: { mode: 'light', background: { default: '#ffffff', }, text: { primary: '#000000', }, },
});
const darkTheme = createTheme({
  palette: { mode: 'dark', background: { default: '#121212', }, text: { primary: '#ffffff', }, },
});

describe('Layout Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseLocation.mockReturnValue({ pathname: '/admin/dashboard' });
    vi.mocked(settingsStore.useSettingsStore).mockReturnValue({
       drawer: false,
       toggleDrawer: mockToggleDrawer,
       toggleThemeMode: mockToggleThemeMode
    });
     vi.mocked(authStore.useAuthStore).mockReturnValue({ user: mockUser });
  });

  const renderWithProviders = (
    initialRoute = '/admin/dashboard',
    theme = lightTheme,
    searchTerm = '',
    setSearchTerm = vi.fn()
  ) => {
    mockUseLocation.mockReturnValue({ pathname: initialRoute });

    return render(
      <ThemeProvider theme={theme}>
        <SearchContext.Provider value={{ searchTerm, setSearchTerm }}>
          <MemoryRouter initialEntries={[initialRoute]}>
            <Routes>
              <Route path="/*" element={<Layout />} />
            </Routes>
          </MemoryRouter>
        </SearchContext.Provider>
      </ThemeProvider>
    );
  };

  it('renders without crashing', () => {
    renderWithProviders();
    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
    expect(screen.getByTestId('admin-drawer')).toBeInTheDocument();
  });

  it('displays admin drawer for admin routes', () => {
    renderWithProviders('/admin/somepage');
    expect(screen.getByTestId('admin-drawer')).toBeInTheDocument();
    expect(screen.queryByTestId('student-drawer')).not.toBeInTheDocument();
    expect(screen.queryByTestId('president-drawer')).not.toBeInTheDocument();
  });

  it('displays student drawer for student routes', () => {
    renderWithProviders('/student/somepage');
    expect(screen.getByTestId('student-drawer')).toBeInTheDocument();
    expect(screen.queryByTestId('admin-drawer')).not.toBeInTheDocument();
    expect(screen.queryByTestId('president-drawer')).not.toBeInTheDocument();
  });

  it('displays president drawer for president users regardless of route', () => {
    vi.mocked(authStore.useAuthStore).mockReturnValueOnce({
      user: { id: 1, name: 'Test President', is_president: true }
    });
    renderWithProviders('/admin/dashboard');
    expect(screen.getByTestId('president-drawer')).toBeInTheDocument();
    expect(screen.queryByTestId('admin-drawer')).not.toBeInTheDocument();
    expect(screen.queryByTestId('student-drawer')).not.toBeInTheDocument();
  });

  it('toggles the drawer when menu icon is clicked', async () => {
    renderWithProviders();
    const menuButton = screen.getByLabelText('open drawer');
    await user.click(menuButton);
    expect(mockToggleDrawer).toHaveBeenCalledTimes(1);
  });

  it('toggles theme mode when theme button is clicked', async () => {
    renderWithProviders('/any/route', lightTheme);
    const themeButton = screen.getByTestId('LightModeOutlinedIcon').closest('button');
    expect(themeButton).toBeInTheDocument();
    if(themeButton) await user.click(themeButton);
    expect(mockToggleThemeMode).toHaveBeenCalledTimes(1);
  });

  it('navigates to admin profile page when profile icon is clicked on admin route', async () => {
    renderWithProviders('/admin/dashboard');
    const profileButton = screen.getByTestId('PersonOutlinedIcon').closest('button');
    expect(profileButton).toBeInTheDocument();
    if(profileButton) await user.click(profileButton);
    expect(mockNavigate).toHaveBeenCalledWith('/admin/profile');
  });

  it('navigates to student profile when profile icon is clicked on student route', async () => {
    renderWithProviders('/student/dashboard');
    const profileButton = screen.getByTestId('PersonOutlinedIcon').closest('button');
    expect(profileButton).toBeInTheDocument();
    if(profileButton) await user.click(profileButton);
    expect(mockNavigate).toHaveBeenCalledWith('/student/profile');
  });

  it('updates search term state when typing in search input (admin)', async () => {
    let searchTermState = '';
    const setSearchTermMock = vi.fn((newValue) => {
      searchTermState = newValue;
    });

    const initialRoute = '/admin/dashboard';
    const theme = lightTheme;

    const { rerender } = render(
      <ThemeProvider theme={theme}>
        <SearchContext.Provider value={{ searchTerm: searchTermState, setSearchTerm: setSearchTermMock }}>
          <MemoryRouter initialEntries={[initialRoute]}>
            <Routes> <Route path="/*" element={<Layout />} /> </Routes>
          </MemoryRouter>
        </SearchContext.Provider>
      </ThemeProvider>
    );

    const searchInput = screen.getByPlaceholderText('Search');
    const finalValue = 'test search';

    fireEvent.change(searchInput, { target: { value: finalValue } });

    expect(setSearchTermMock).toHaveBeenCalledTimes(1);
    expect(setSearchTermMock).toHaveBeenCalledWith(finalValue);

    rerender(
      <ThemeProvider theme={theme}>
        <SearchContext.Provider value={{ searchTerm: searchTermState, setSearchTerm: setSearchTermMock }}>
          <MemoryRouter initialEntries={[initialRoute]}>
            <Routes> <Route path="/*" element={<Layout />} /> </Routes>
          </MemoryRouter>
        </SearchContext.Provider>
      </ThemeProvider>
    );

    const updatedSearchInput = await screen.findByPlaceholderText('Search');
    expect(updatedSearchInput).toHaveValue(finalValue);
  });

   it('navigates on search when hitting enter (student)', async () => {
     const searchTerm = 'query';
     const setSearchTermMock = vi.fn();
     renderWithProviders('/student/dashboard', lightTheme, searchTerm, setSearchTermMock);
     const searchInput = screen.getByPlaceholderText('Search');
     await user.clear(searchInput);
     await user.type(searchInput, searchTerm + '{enter}');
     expect(mockNavigate).toHaveBeenCalledWith(`/student/student-search?q=${encodeURIComponent(searchTerm)}`);
   });

   it('updates search term state on search icon click (admin)', async () => {
     const searchTerm = 'admin query';
     const setSearchTermMock = vi.fn();
      render(
        <ThemeProvider theme={lightTheme}>
          <SearchContext.Provider value={{ searchTerm: searchTerm, setSearchTerm: setSearchTermMock }}>
            <MemoryRouter initialEntries={['/admin/dashboard']}>
              <Routes>
                <Route path="/*" element={<Layout />} />
              </Routes>
            </MemoryRouter>
          </SearchContext.Provider>
        </ThemeProvider>
      );
      const searchButton = screen.getByTestId('SearchIcon').closest('button');
      expect(searchButton).toBeInTheDocument();
      if(searchButton) await user.click(searchButton);
      expect(setSearchTermMock).toHaveBeenCalledWith(searchTerm);
      expect(mockNavigate).not.toHaveBeenCalled();
   });

  it('renders dark mode icon in dark theme', () => {
    renderWithProviders('/admin/dashboard', darkTheme);
    expect(screen.getByTestId('DarkModeOutlinedIcon')).toBeInTheDocument();
    expect(screen.queryByTestId('LightModeOutlinedIcon')).not.toBeInTheDocument();
  });

  it('handles missing user data gracefully', () => {
     vi.mocked(authStore.useAuthStore).mockReturnValueOnce({ user: null });
     renderWithProviders('/admin/dashboard');
     expect(screen.getByTestId('admin-drawer')).toBeInTheDocument();
  });
});