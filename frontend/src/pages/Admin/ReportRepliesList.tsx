import React, { useEffect, useState, useContext, useCallback, useMemo } from 'react';
import { Box, Button, Typography, useTheme, Alert, Chip, CircularProgress } from "@mui/material";
import { DataGrid, GridToolbar, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { tokens } from "../../theme/theme";
import { SearchContext } from "../../components/layout/SearchContext";
import { useSettingsStore } from "../../stores/settings-store";
import { fetchReportsWithReplies } from './fetchReports';
import { ReportReply } from '../../types';
import { useNavigate } from 'react-router-dom';

/**
 * ReportRepliesList Component
 * Displays a list of reports that have been replied to and need further attention
 */
const ReportRepliesList: React.FC = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const [reports, setReports] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const { searchTerm } = useContext(SearchContext);
    const { drawer } = useSettingsStore();
    const navigate = useNavigate();
    
    const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds
  
    /**
     * Load reports from the API
     */
    const loadReports = useCallback(async () => {
      try {
        setLoading(true);
        const data = await fetchReportsWithReplies();
        setReports(data);
        setError(null);
      } catch (error) {
        setError("Failed to fetch reports with replies.");
        console.error("Error fetching reports:", error);
      } finally {
        setLoading(false);
      }
    }, []);
  
    // Load reports on component mount and set up refresh interval
    useEffect(() => {
      loadReports();
      
      // Refresh data every 5 minutes
      const intervalId = setInterval(loadReports, REFRESH_INTERVAL);
      
      // Clean up interval on component unmount
      return () => clearInterval(intervalId);
    }, [loadReports]);
  
    /**
     * Navigate to report thread view
     */
    const handleViewThread = useCallback((reportId: number | string) => {
      navigate(`/admin/report-thread/${reportId}`);
    }, [navigate]);
  
    /**
     * Navigate to reply form
     */
    const handleReply = useCallback((reportId: number | string) => {
      navigate(`/admin/report-list/${reportId}/reply`);
    }, [navigate]);
  
    /**
     * Format date to locale string
     */
    const formatDate = useCallback((dateString: string) => {
      try {
        return new Date(dateString).toLocaleString();
      } catch (error) {
        return "Invalid date";
      }
    }, []);
  
    // Filter reports based on search term
    const filteredReports = useMemo(() => 
      reports.filter((report) =>
        Object.values(report)
          .join(" ")
          .toLowerCase()
          .includes((searchTerm || '').toLowerCase())
      ),
      [reports, searchTerm]
    );
  
    // Column definitions
    const columns: GridColDef[] = useMemo(() => [
      { field: "id", headerName: "ID", flex: 0.5 },
      { field: "subject", headerName: "Subject", flex: 1.5 },
      { field: "from_student_name", headerName: "From", flex: 1 },
      { 
        field: "latest_reply_content", 
        headerName: "Latest Reply", 
        flex: 2,
        renderCell: (params: GridRenderCellParams) => (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {params.row.latest_reply.replied_by}:
            </Typography>
            <Typography variant="body2" noWrap title={params.row.latest_reply.content}>
              {params.row.latest_reply.content}
            </Typography>
          </Box>
        )
      },
      { 
        field: "status", 
        headerName: "Status", 
        flex: 0.8,
        renderCell: () => (
          <Chip
            label="NEEDS REPLY"
            color="error"
            size="small"
            sx={{ fontWeight: 'bold' }}
          />
        )
      },
      { 
        field: "latest_reply_date", 
        headerName: "Latest Reply Date", 
        flex: 1.2,
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant="body2">
            {formatDate(params.row.latest_reply.created_at)}
          </Typography>
        )
      },
      { 
        field: "requested_at", 
        headerName: "Report Date", 
        flex: 1.2,
        renderCell: (params: GridRenderCellParams) => (
          <Typography variant="body2">
            {formatDate(params.row.requested_at)}
          </Typography>
        )
      },
      {
        field: "actions",
        headerName: "Actions",
        flex: 1,
        renderCell: (params: GridRenderCellParams) => (
          <Box sx={{ display: 'flex', gap: '8px' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleViewThread(params.row.id)}
              size="small"
            >
              View Thread
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => handleReply(params.row.id)}
              size="small"
            >
              Reply
            </Button>
          </Box>
        )
      }
    ], [handleViewThread, handleReply, formatDate]);
  
    // Show loading state
    if (loading && reports.length === 0) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading reports...</Typography>
        </Box>
      );
    }
  
    return (
      <Box
        sx={{
          height: "calc(100vh - 64px)",
          maxWidth: drawer ? `calc(100% - 3px)`: "100%",
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
          Reports Needing Reply
        </Typography>
        
        {error && (
          <Alert 
            severity="error" 
            sx={{ marginBottom: "1rem" }}
            onClose={() => setError(null)}
          >
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
              noRowsOverlay: () => (
                <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                  <Typography>No reports found</Typography>
                </Box>
              ),
            }}
            getRowId={(row) => row.id}
            resizeThrottleMs={0}
            autoHeight
            loading={loading}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10, page: 0 },
              },
              sorting: {
                sortModel: [{ field: 'latest_reply_date', sort: 'desc' }],
              },
            }}
            pageSizeOptions={[5, 10, 25, 50]}
            disableRowSelectionOnClick
          />
        </Box>
      </Box>
    );
  };
  
export default ReportRepliesList;