// TODO: come back to make sure this page works once seed is working

import React, { useEffect, useState, useContext, useCallback, useMemo } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  useTheme, 
  CircularProgress, 
  Alert 
} from "@mui/material";
import { DataGrid, GridColDef, GridToolbar, GridRenderCellParams } from "@mui/x-data-grid";
import { tokens } from "../../theme/theme";
import { SearchContext } from "../../components/layout/SearchContext";
import { useSettingsStore } from "../../stores/settings-store";
import { apiClient } from "../../api";
import { useNavigate } from 'react-router-dom';

/**
 * Interface for report with replies
 */
interface ReportWithReplies {
  id: number | string;
  from_student_username: string;
  report_type: string;
  subject: string;
  latest_reply: string;
  reply_count: number;
  latest_reply_date: string;
  [key: string]: any; // For other potential fields
}

/**
 * Custom NoRowsOverlay component for DataGrid
 */
const CustomNoRowsOverlay: React.FC<{ loading: boolean }> = ({ loading }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
  return (
    <Box display="flex" alignItems="center" justifyContent="center" height="100%">
      <Typography variant="h6" color={colors.grey[100]}>
        {loading ? "Loading reports..." : "No reports with replies found"}
      </Typography>
    </Box>
  );
};

/**
 * ReportRepliedList component displays reports that have been replied to
 */
const ReportRepliedList: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const { searchTerm } = useContext(SearchContext);
  const { drawer } = useSettingsStore();
  
  // Component state
  const [reportsWithReplies, setReportsWithReplies] = useState<ReportWithReplies[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch reports with replies from the API
   */
  const fetchReportsWithReplies = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/api/reports-replied");
      setReportsWithReplies(response.data || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching reports with replies:", err);
      setError("Failed to fetch reports with replies. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data on component mount
  useEffect(() => {
    fetchReportsWithReplies();
  }, [fetchReportsWithReplies]);

  /**
   * Navigate to report thread detail view
   */
  const handleViewThread = useCallback((reportId: string | number) => {
    navigate(`/admin/report-thread/${reportId}`);
  }, [navigate]);

  /**
   * Filter reports based on search term
   */
  const filteredReports = useMemo(() => 
    reportsWithReplies.filter((report) =>
      Object.values(report)
        .join(" ")
        .toLowerCase()
        .includes((searchTerm || '').toLowerCase())
    ),
    [reportsWithReplies, searchTerm]
  );

  /**
   * Render truncated text with ellipsis
   */
  const renderTruncatedText = useCallback((text: string, maxLength: number) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength - 3)}...` : text;
  }, []);

  /**
   * Format date string to locale format
   */
  const formatDate = useCallback((dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString();
    } catch (e) {
      return "Invalid date";
    }
  }, []);

  // Column definitions for the data grid
  const columns: GridColDef[] = useMemo(() => [
    { field: "id", headerName: "ID", flex: 0.5 },
    { field: "from_student_username", headerName: "Reporter", flex: 1 },
    { field: "report_type", headerName: "Report Type", flex: 1 },
    { 
      field: "subject", 
      headerName: "Subject", 
      flex: 1.5,
      renderCell: (params: GridRenderCellParams) => (
        <Typography title={params.value as string}>
          {renderTruncatedText(params.value as string, 50)}
        </Typography>
      )
    },
    { 
      field: "latest_reply", 
      headerName: "Latest Reply", 
      flex: 2,
      renderCell: (params: GridRenderCellParams) => (
        <Typography title={params.value as string}>
          {renderTruncatedText(params.value as string, 100)}
        </Typography>
      )
    },
    { field: "reply_count", headerName: "Total Replies", flex: 0.8 },
    {
      field: "latest_reply_date",
      headerName: "Latest Reply Date",
      flex: 1.5,
      valueFormatter: (params) => formatDate(params.value as string),
    },
    {
      field: "action",
      headerName: "Actions",
      flex: 1,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleViewThread(params.row.id)}
          size="small"
        >
          View Thread
        </Button>
      ),
    }
  ], [handleViewThread, renderTruncatedText, formatDate]);

  // Early return if there's an error and no data
  if (error && !reportsWithReplies.length) {
    return (
      <Box p={2} display="flex" justifyContent="center">
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: "calc(100vh - 64px)",
        maxWidth: drawer ? `calc(100% - 3px)` : "100%",
        p: 2,
      }}
    >
      <Typography
        variant="h1"
        sx={{
          color: theme.palette.mode === "light" ? colors.grey[100] : colors.grey[100],
          fontSize: "1.75rem",
          fontWeight: 800,
          marginBottom: "1rem",
        }}
      >
        Replied Reports
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
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
          rows={filteredReports}
          columns={columns}
          slots={{ 
            toolbar: GridToolbar,
            noRowsOverlay: () => <CustomNoRowsOverlay loading={loading} />,
            loadingOverlay: () => <CircularProgress />
          }}
          getRowId={(row) => row.id}
          resizeThrottleMs={0}
          autoHeight
          loading={loading}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
            sorting: {
              sortModel: [{ field: 'latest_reply_date', sort: 'desc' }],
            },
          }}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
        />
      </Box>
    </Box>
  );
};

export default ReportRepliedList;