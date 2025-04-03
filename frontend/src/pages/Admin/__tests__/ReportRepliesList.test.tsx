import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReportRepliesList from '../ReportRepliesList';
import { SearchContext } from '../../../components/layout/SearchContext';
import { MemoryRouter } from 'react-router-dom';

const mockFetchReportsWithReplies = vi.fn();

vi.mock('../../../utils/fetchReports', () => ({
  fetchReportsWithReplies: () => mockFetchReportsWithReplies()
}));

import { useSettingsStore } from '../../../stores/settings-store';

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

vi.mock('@mui/x-data-grid', () => ({
  DataGrid: ({ rows, columns }) => {
    const renderActionColumn = (row) => {
      const actionColumn = columns.find(c => c.field === 'actions');
      if (actionColumn && actionColumn.renderCell) {
        return actionColumn.renderCell({ row });
      }
      return null;
    };

    return (
      <div data-testid="data-grid">
        <div data-testid="row-count">{rows.length}</div>
        <div data-testid="column-count">{columns.length}</div>
        {rows.map((row) => (
          <div key={row.id} data-testid={`row-${row.id}`}>
            {row.subject}
            <div data-testid={`view-actions-${row.id}`}>
              {renderActionColumn(row)}
            </div>
          </div>
        ))}
      </div>
    );
  },
  GridToolbar: () => <div data-testid="grid-toolbar">GridToolbar</div>,
  GridColDef: {},
  GridRenderCellParams: {},
}));

const mockReports = [
  {
    id: 1,
    subject: 'Test Subject 1',
    from_student_name: 'Student One',
    latest_reply: {
      replied_by: 'Admin',
      content: 'This is a reply to report 1',
      created_at: '2023-10-15T14:30:00Z',
    },
    requested_at: '2023-10-14T10:00:00Z',
  },
  {
    id: 2,
    subject: 'Test Subject 2',
    from_student_name: 'Student Two',
    latest_reply: {
      replied_by: 'Support',
      content: 'This is a reply to report 2',
      created_at: '2023-10-16T09:15:00Z',
    },
    requested_at: '2023-10-15T08:30:00Z',
  },
];

describe('ReportRepliesList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockFetchReportsWithReplies.mockResolvedValue(mockReports);
    vi.mocked(useSettingsStore).mockReturnValue({ drawer: false });
  });

  it('renders loading state initially', async () => {
    mockFetchReportsWithReplies.mockImplementation(() => {
      return new Promise(() => {});
    });

    render(
      <SearchContext.Provider value={{ searchTerm: '', setSearchTerm: vi.fn() }}>
        <MemoryRouter>
          <ReportRepliesList />
        </MemoryRouter>
      </SearchContext.Provider>
    );

    expect(screen.getByText('Loading reports...')).toBeInTheDocument();
  });

  it('renders reports with replies correctly after loading', async () => {
    render(
      <SearchContext.Provider value={{ searchTerm: '', setSearchTerm: vi.fn() }}>
        <MemoryRouter>
          <ReportRepliesList />
        </MemoryRouter>
      </SearchContext.Provider>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading reports...')).not.toBeInTheDocument();
    });

    expect(mockFetchReportsWithReplies).toHaveBeenCalledTimes(1);

    expect(screen.getByTestId('row-count').textContent).toBe('2');
    expect(screen.getByTestId('column-count').textContent).toBe('6');
    expect(screen.getByTestId('row-1')).toHaveTextContent('Test Subject 1');
    expect(screen.getByTestId('row-2')).toHaveTextContent('Test Subject 2');
  });

  it('handles API fetch errors correctly', async () => {
    mockFetchReportsWithReplies.mockRejectedValue(new Error('API Error'));

    render(
      <SearchContext.Provider value={{ searchTerm: '', setSearchTerm: vi.fn() }}>
        <MemoryRouter>
          <ReportRepliesList />
        </MemoryRouter>
      </SearchContext.Provider>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading reports...')).not.toBeInTheDocument();
    });
    
    expect(screen.getByText('Failed to fetch reports with replies.')).toBeInTheDocument();
    expect(mockFetchReportsWithReplies).toHaveBeenCalledTimes(1);
  });

  it('navigates to report thread when View Thread button is clicked', async () => {
    render(
      <SearchContext.Provider value={{ searchTerm: '', setSearchTerm: vi.fn() }}>
        <MemoryRouter>
          <ReportRepliesList />
        </MemoryRouter>
      </SearchContext.Provider>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading reports...')).not.toBeInTheDocument();
    });

    const viewButtons = screen.getAllByRole('button', { name: /view/i });
    await userEvent.click(viewButtons[0]);

    expect(mockNavigate).toHaveBeenCalledWith('/admin/report-thread/1');
  });

  it('navigates to reply page when Reply button is clicked', async () => {
    render(
      <SearchContext.Provider value={{ searchTerm: '', setSearchTerm: vi.fn() }}>
        <MemoryRouter>
          <ReportRepliesList />
        </MemoryRouter>
      </SearchContext.Provider>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading reports...')).not.toBeInTheDocument();
    });

    const replyButtons = screen.getAllByRole('button', { name: /reply/i });
    await userEvent.click(replyButtons[0]);

    expect(mockNavigate).toHaveBeenCalledWith('/admin/report-list/1/reply');
  });

  it('adjusts layout based on drawer state', async () => {
    vi.mocked(useSettingsStore).mockReturnValue({ drawer: true });
    
    const { container } = render(
      <SearchContext.Provider value={{ searchTerm: '', setSearchTerm: vi.fn() }}>
        <MemoryRouter>
          <ReportRepliesList />
        </MemoryRouter>
      </SearchContext.Provider>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading reports...')).not.toBeInTheDocument();
    });

    const boxElement = container.querySelector('.MuiBox-root');
    expect(boxElement).toBeInTheDocument();
  });
});