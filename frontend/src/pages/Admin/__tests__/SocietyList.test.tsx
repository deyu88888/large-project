import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, test, describe, vi, beforeEach } from 'vitest';
import SocietyList from '../SocietyList';
import { SearchContext } from "../../../components/layout/SearchContext";
import { ThemeProvider, createTheme } from '@mui/material/styles';

vi.mock('../../../api', () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    request: vi.fn()
  },
  apiPaths: {
    USER: {
      SOCIETY: '/api/society/request/approved',
      DELETE: vi.fn().mockReturnValue('/api/delete')
    }
  }
}));

vi.mock('../../../stores/settings-store', () => ({
  useSettingsStore: vi.fn().mockReturnValue({
    drawer: false
  })
}));

vi.mock('../../../theme/theme', () => ({
  tokens: vi.fn().mockReturnValue({
    grey: {},
    primary: { 400: '#f5f5f5' },
    greenAccent: {},
    redAccent: {},
    blueAccent: { 400: '#2196f3', 500: '#2196f3', 700: '#1976d2' }
  })
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

describe('Society List Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should render society list page', async () => {
    render(
      <ThemeProvider theme={createTheme()}>
        <SearchContext.Provider value={{ searchTerm: '', setSearchTerm: vi.fn() }}>
          <MemoryRouter initialEntries={['/admin/society-list']}>
            <Routes>
              <Route path="/admin/society-list" element={<SocietyList />} />
            </Routes>
          </MemoryRouter>
        </SearchContext.Provider>
      </ThemeProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /columns/i })).toBeInTheDocument();
    });
    
    expect(screen.getByRole('button', { name: /filters/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /density/i })).toBeInTheDocument();
    
    const columnHeaders = screen.getAllByRole('columnheader');
    expect(columnHeaders.length).toBeGreaterThan(0);
  });
});