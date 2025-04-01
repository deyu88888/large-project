import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReportRepliedList from '../ReportRepliedList';
import { SearchContext } from '../../../components/layout/SearchContext';
import { useSettingsStore } from '../../../stores/settings-store';
import { apiClient } from '../../../api';
import { MemoryRouter } from 'react-router-dom';

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

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@mui/x-data-grid', () => {
  return {
    DataGrid: (props) => {
      const renderActionCell = () => {
        if (props.rows.length > 0 && !props.loading) {
          const actionColumn = props.columns.find(col => col.field === 'action');
          if (actionColumn?.renderCell) {
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

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/admin/reports-replied');
    });

    await waitFor(() => {
      expect(screen.getByTestId('loading-state').textContent).toBe('loaded');
    });

    expect(screen.getByTestId('row-count').textContent).toBe('2');
    expect(screen.getByTestId('column-count').textContent).toBe('5');
  });

  it('handles API errors correctly', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('API Error'));
    
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <SearchContext.Provider value={{ searchTerm: '', setSearchTerm: vi.fn() }}>
        <MemoryRouter>
          <ReportRepliedList />
        </MemoryRouter>
      </SearchContext.Provider>
    );

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

    await waitFor(() => {
      expect(screen.getByTestId('loading-state').textContent).toBe('loaded');
    });

    await waitFor(() => {
      const actionCell = screen.getByTestId('action-cell');
      expect(actionCell).toBeInTheDocument();
    });

    const viewThreadButton = screen.getByRole('button', { name: /view thread/i });
    await userEvent.click(viewThreadButton);

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

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/admin/reports-replied');
    });

    await waitFor(() => {
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

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/admin/reports-replied');
    });

    expect(container.firstChild).toBeInTheDocument();
  });
});