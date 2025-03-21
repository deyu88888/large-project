import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, test, describe, vi, beforeEach } from 'vitest';
import SocietyList from '../SocietyList';
import { SearchContext } from "../../../components/layout/SearchContext";
import { useSettingsStore } from "../../../stores/settings-store";
import { ThemeProvider, createTheme } from '@mui/material/styles';

vi.mock('../../../api', () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({ data: [] })
  },
  apiPaths: {
    USER: {
      SOCIETY: '/api/society/request/approved'
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

const mockWebSocket = {
  onopen: null,
  onmessage: null,
  onerror: null,
  onclose: null,
  close: vi.fn()
};

global.WebSocket = vi.fn().mockImplementation(() => mockWebSocket);

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
    
    // Call all WebSocket handlers to avoid act warnings
    mockWebSocket.onopen && mockWebSocket.onopen({});
    
    // Use testid to find the heading to avoid text matching issues
    await waitFor(() => {
      expect(screen.getByTestId("society-list-title")).toBeInTheDocument();
    });
    
    expect(screen.getByText(/Society List/i)).toBeInTheDocument();
    expect(screen.getByText(/Name/i)).toBeInTheDocument();
    
    // Use getAllByText and check that one of them exists instead of getByText
    const membersElements = screen.getAllByText(/^Members$/i);
    expect(membersElements.length).toBeGreaterThan(0);
    
    expect(screen.getByText(/president/i)).toBeInTheDocument();
  });
});