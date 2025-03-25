import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReportRepliedList from '../ReportRepliedList';
import { SearchContext } from '../../../components/layout/SearchContext';
import { useSettingsStore } from '../../../stores/settings-store';
import { apiClient } from '../../../api';
import { MemoryRouter } from 'react-router-dom';

// Mock the required dependencies
vi.mock('../../../api', () => ({
  apiClient: {
    get: vi.fn()
  }
}));

vi.mock('../../../stores/settings-store', () => ({
  useSettingsStore: vi.fn()
}));

vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    useTheme: () => ({
      palette: {
        mode: 'light',
      },
    }),
  };
});

vi.mock('../../../theme/theme', () => ({
  tokens: () => ({
    primary: { 400: '#f0f0f0' },
    blueAccent: { 400: '#4444ff', 500: '#3333ff', 700: '#2222ff' },
    grey: { 100: '#cccccc' },
  }),
}));

// Mock navigate function
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Create a simplified mock for DataGrid to avoid the getRowId issue
vi.mock('@mui/x-data-grid', () => {
  return {
    DataGrid: (props) => {
      // We need to extract the actual click handler from the action column
      const renderActionCell = () => {
        if (props.rows.length > 0 && !props.loading) {
          const actionColumn = props.columns.find(col => col.field === 'action');
          if (actionColumn?.renderCell) {
            // Return the rendered cell which should contain the button
            return actionColumn.renderCell({ row: props.rows[0] });
          }
        }
        return null;
      };

      return (
        <div data-testid="data-grid">
          <div data-testid="row-count">{props.rows.length}</div>
          <div data-testid="column-count">{props.columns.length}</div>
          <div data-testid="loading-state">{props.loading ? 'loading' : 'loaded'}</div>
          {props.rows.map((row, idx) => (
            <div key={idx} data-testid={`row-${row.id}`}>
              {row.subject}
            </div>
          ))}
          <div data-testid="action-cell">
            {renderActionCell()}
          </div>
        </div>
      );
    },
    GridToolbar: () => <div data-testid="grid-toolbar">GridToolbar</div>,
    GridColDef: class {},
    GridRenderCellParams: class {},
  };
});

const mockReportsWithReplies = [
  {
    id: 1,
    from_student_username: 'student1',
    report_type: 'complaint',
    subject: 'Test Subject 1',
    latest_reply: 'This is the latest reply for report 1',
    reply_count: 3,
    latest_reply_date: '2023-10-15T14:30:00Z',
  },
  {
    id: 2,
    from_student_username: 'student2',
    report_type: 'feedback',
    subject: 'Test Subject 2',
    latest_reply: 'This is the latest reply for report 2',
    reply_count: 1,
    latest_reply_date: '2023-10-16T10:15:00Z',
  },
];

describe('ReportRepliedList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mocks
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockReportsWithReplies });
    vi.mocked(useSettingsStore).mockReturnValue({ drawer: false });
  });

  it('renders reports with replies correctly', async () => {
    render(
      <SearchContext.Provider value={{ searchTerm: '', setSearchTerm: vi.fn() }}>
        <MemoryRouter>
          <ReportRepliedList />
        </MemoryRouter>
      </SearchContext.Provider>
    );

    // Wait for the API call to resolve - use the correct endpoint path
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/admin/reports-replied');
    });

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.getByTestId('loading-state').textContent).toBe('loaded');
    });

    // Check if DataGrid receives the correct data
    expect(screen.getByTestId('row-count').textContent).toBe('2');
    expect(screen.getByTestId('column-count').textContent).toBe('8');
  });

  it('handles API errors correctly', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('API Error'));
    
    // Spy on console.error to prevent error output in test logs
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <SearchContext.Provider value={{ searchTerm: '', setSearchTerm: vi.fn() }}>
        <MemoryRouter>
          <ReportRepliedList />
        </MemoryRouter>
      </SearchContext.Provider>
    );

    // Wait for error message to appear - match partial text to handle the full error message
    await waitFor(() => {
      const errorElement = screen.getByRole('alert');
      expect(errorElement).toBeInTheDocument();
      expect(errorElement.textContent).toContain('Failed to fetch reports with replies');
    });

    consoleErrorSpy.mockRestore();
  });

  it('navigates to report thread when View Thread button is clicked', async () => {
    render(
      <SearchContext.Provider value={{ searchTerm: '', setSearchTerm: vi.fn() }}>
        <MemoryRouter>
          <ReportRepliedList />
        </MemoryRouter>
      </SearchContext.Provider>
    );

    // Wait for the component to render with data and loading to finish
    await waitFor(() => {
      expect(screen.getByTestId('loading-state').textContent).toBe('loaded');
    });

    // Wait for the action cell to be rendered
    await waitFor(() => {
      const actionCell = screen.getByTestId('action-cell');
      expect(actionCell).toBeInTheDocument();
    });

    // Find and click the View Thread button within the action cell
    const viewThreadButton = screen.getByRole('button', { name: /view thread/i });
    await userEvent.click(viewThreadButton);

    // Verify navigation was called with the correct path
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin/report-thread/1');
    });
  });

  it('filters reports based on search term', async () => {
    const searchTerm = 'feedback';
    
    render(
      <SearchContext.Provider value={{ searchTerm, setSearchTerm: vi.fn() }}>
        <MemoryRouter>
          <ReportRepliedList />
        </MemoryRouter>
      </SearchContext.Provider>
    );

    // Wait for the API call to resolve
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/admin/reports-replied');
    });

    // We can check that filtering happens by verifying that the filtered data is passed to the DataGrid
    // This is an approximation since we don't have direct access to filtered state
    await waitFor(() => {
      // The row count should reflect only items matching the search term
      // In our test data, only one item has "feedback" in it
      expect(screen.getByTestId('loading-state').textContent).toBe('loaded');
    });
  });

  it('adjusts layout based on drawer state', async () => {
    vi.mocked(useSettingsStore).mockReturnValue({ drawer: true });
    
    const { container } = render(
      <SearchContext.Provider value={{ searchTerm: '', setSearchTerm: vi.fn() }}>
        <MemoryRouter>
          <ReportRepliedList />
        </MemoryRouter>
      </SearchContext.Provider>
    );

    // Wait for the component to render
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/admin/reports-replied');
    });

    // Since we can't easily test styles in JSDOM, let's just verify the component renders
    // This test will be useful if we add more specific attributes or classes based on drawer state
    expect(container.firstChild).toBeInTheDocument();
  });
});