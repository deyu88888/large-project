import React, { useEffect, useState, useContext, useCallback, useMemo } from 'react';
import { Box, Button, Typography, useTheme, Alert, Chip, CircularProgress } from "@mui/material";
import { DataGrid, GridToolbar, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { tokens } from "../../theme/theme";
import { SearchContext } from "../../components/layout/SearchContext";
import { useSettingsStore } from "../../stores/settings-store";
import { fetchReportsWithReplies } from '../../utils/fetchReports';
import { useNavigate } from 'react-router-dom';
import { Report } from "../../types/president/report";
import {
  ReportState,
  LatestReplyProps,
  DateCellProps,
  ActionButtonsProps,
  ErrorAlertProps,
  LoadingStateProps,
  DataGridContainerProps
} from "../../types/admin/ReportRepliesList";

const REFRESH_INTERVAL = 5 * 60 * 1000; 

const formatDateToLocale = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleString();
  } catch (error) {
    return "Invalid date";
  }
};

const filterReportsBySearchTerm = (reports: Report[], searchTerm: string): Report[] => {
  if (!searchTerm) return reports;
  
  const normalizedSearchTerm = searchTerm.toLowerCase();
  
  return reports.filter((report) =>
    Object.values(report)
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearchTerm)
  );
};

const LatestReplyCell: React.FC<LatestReplyProps> = ({ repliedBy, content }) => {
  return (
    <Box>
      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
        {repliedBy}:
      </Typography>
      <Typography variant="body2" noWrap title={content}>
        {content}
      </Typography>
    </Box>
  );
};

const StatusCell: React.FC = () => {
  return (
    <Chip
      label="NEEDS REPLY"
      color="error"
      size="small"
      sx={{ fontWeight: 'bold' }}
    />
  );
};

const DateCell: React.FC<DateCellProps> = ({ dateString, formatter }) => {
  return (
    <Typography variant="body2">
      {formatter(dateString)}
    </Typography>
  );
};

const ActionButtons: React.FC<ActionButtonsProps> = ({ reportId, onViewThread, onReply }) => {
  return (
    <Box sx={{ display: 'flex', gap: '8px' }}>
      <Button
        variant="contained"
        color="primary"
        onClick={() => onViewThread(reportId)}
        size="small"
      >
        View Thread
      </Button>
      <Button
        variant="contained"
        color="error"
        onClick={() => onReply(reportId)}
        size="small"
      >
        Reply
      </Button>
    </Box>
  );
};

const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, onClose }) => {
  return (
    <Alert 
      severity="error" 
      sx={{ marginBottom: "1rem" }}
      onClose={onClose}
    >
      {message}
    </Alert>
  );
};

const LoadingState: React.FC<LoadingStateProps> = ({ message }) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <CircularProgress />
      <Typography sx={{ ml: 2 }}>{message}</Typography>
    </Box>
  );
};

const DataGridContainer: React.FC<DataGridContainerProps> = ({ reports, columns, loading, colors, drawer }) => {
  return (
    <Box
      sx={{
        height: "calc(100vh - 64px)",
        maxWidth: drawer ? `calc(100% - 3px)`: "100%",
      }}
    > 
      <Box
        sx={{
          height: "78vh",
          "& .MuiDataGrid-root": { border: "none" },
          "& .MuiDataGrid-cell": { borderBottom: "none" },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: colors.blueAccent[700],
            borderBottom: "none",
          },
          "& .MuiDataGrid-columnHeader": {
            whiteSpace: "normal",
            wordBreak: "break-word",
          },
          "& .MuiDataGrid-virtualScroller": {
            backgroundColor: colors.primary[400],
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "none",
            backgroundColor: colors.blueAccent[700],
          },
          "& .MuiCheckbox-root": {
            color: `${colors.blueAccent[400]} !important`,
          },
          "& .MuiDataGrid-toolbarContainer .MuiButton-text": {
            color: `${colors.blueAccent[500]} !important`,
          },
        }}
      >
        <DataGrid
          rows={reports}
          columns={columns}
          slots={{ toolbar: GridToolbar }}
          resizeThrottleMs={0}
          autoHeight
          loading={loading}
          disableRowSelectionOnClick
          initialState={{
            pagination: { paginationModel: { pageSize: 100 } },
          }}
        />
      </Box>
    </Box>
  );
};

const createReportColumns = (
  handleViewThread: (id: number | string) => void,
  handleReply: (id: number | string) => void,
  formatDate: (dateString: string) => string
): GridColDef[] => {
  return [
      { field: "id", headerName: "ID", flex: 0.5 },
      { field: "subject", headerName: "Subject", flex: 1.0 },
      { field: "from_student_name", headerName: "From", flex: 1 },
      { 
        field: "latest_reply_date", 
        headerName: "Latest Reply Date", 
        flex: 1.2,
        renderCell: (params: GridRenderCellParams) => (
            formatDate(params.row.latest_reply.created_at)
        )
      },
      { 
        field: "requested_at", 
        headerName: "Report Date", 
        flex: 1.2,
        renderCell: (params: GridRenderCellParams) => (
            formatDate(params.row.requested_at)
        )
      },
      {
        field: "actions",
        headerName: "Actions",
        flex: 1,
        filterable: false,
        sortable: false,
        minWidth: 165,
        width: 165,
        renderCell: (params: GridRenderCellParams) => (
          <Box>
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleViewThread(params.row.id)}
              sx={{ marginRight: "8px" }}
            >
              View
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => handleReply(params.row.id)}
            >
              Reply
            </Button>
          </Box>
        )
      }
  ];
};

const loadReportData = async (): Promise<Report[]> => {
  return await fetchReportsWithReplies() as any;
};

const ReportRepliesList: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { searchTerm } = useContext(SearchContext);
  const { drawer } = useSettingsStore();
  const navigate = useNavigate();
  
  const [reportState, setReportState] = useState<ReportState>({
    items: [],
    loading: true,
    error: null
  });

  const handleViewThread = useCallback((reportId: number | string) => {
    navigate(`/admin/report-thread/${reportId}`);
  }, [navigate]);

  const handleReply = useCallback((reportId: number | string) => {
    navigate(`/admin/report-list/${reportId}/reply`);
  }, [navigate]);

  const handleClearError = useCallback(() => {
    setReportState(prev => ({ ...prev, error: null }));
  }, []);

  const fetchReports = useCallback(async () => {
    setReportState(prev => ({ ...prev, loading: true }));
    
    try {
      const data = await loadReportData();
      setReportState({
        items: data,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error("Error fetching reports:", error);
      setReportState(prev => ({
        ...prev,
        error: "Failed to fetch reports with replies.",
        loading: false
      }));
    }
  }, []);

  useEffect(() => {
    fetchReports();
    
    const intervalId = setInterval(fetchReports, REFRESH_INTERVAL);
    
    return () => clearInterval(intervalId);
  }, [fetchReports]);

  const formatDate = useCallback(formatDateToLocale, []);

  const filteredReports = useMemo(() => 
    filterReportsBySearchTerm(reportState.items, searchTerm || ''),
    [reportState.items, searchTerm]
  );

  const columns = useMemo(() => 
    createReportColumns(handleViewThread, handleReply, formatDate),
    [handleViewThread, handleReply, formatDate]
  );

  if (reportState.loading && reportState.items.length === 0) {
    return <LoadingState message="Loading reports..." />;
  }

  return (
    <>
      {reportState.error && (
        <ErrorAlert 
          message={reportState.error} 
          onClose={handleClearError}
        />
      )}
      
      <DataGridContainer 
        reports={filteredReports}
        columns={columns}
        loading={reportState.loading}
        colors={colors}
        drawer={drawer}
      />
    </>
  );
};
  
export default ReportRepliesList;