import React, { useEffect, useState, useContext, useCallback } from 'react';
import { Box, Button, Typography, useTheme } from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams, GridToolbar } from "@mui/x-data-grid";
import { tokens } from "../../theme/theme";
import { SearchContext } from "../../components/layout/SearchContext";
import { useSettingsStore } from "../../stores/settings-store";
import { fetchReports } from './fetchReports';
import { Report } from '../../types';
import { useNavigate } from 'react-router-dom';

/**
 * AdminReportList component displays a list of reports with filtering and reply actions
 */
const AdminReportList: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();  
  const { searchTerm } = useContext(SearchContext);
  const { drawer } = useSettingsStore(); 

  // State management
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch reports from API
   */
  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchReports();
      setReports(data);
      setError(null);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
      setError("Failed to fetch reports. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load reports on component mount
  useEffect(() => {
    loadReports();
  }, [loadReports]);

  /**
   * Filter reports based on search term
   */
  const filteredReports = reports.filter((report) =>
    Object.values(report)
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );   
  
  /**
   * Navigate to reply page
   */
  const handleReplyClick = (reportId: string) => {
    navigate(`/admin/report-list/${reportId}/reply`);
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  /**
   * Column definitions for DataGrid
   */
  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", flex: 0.5 },
    { field: "from_student", headerName: "Reporter", flex: 1 },
    { field: "report_type", headerName: "Report Type", flex: 1 },
    { field: "subject", headerName: "Subject", flex: 1.5 },
    { field: "details", headerName: "Details", flex: 2 },
    {
      field: "created_at",
      headerName: "Created At",
      flex: 1.5,
      renderCell: (params: GridRenderCellParams) => formatDate(params.row.created_at),
    },
    {
      field: "action", 
      headerName: "Actions",
      flex: 1,
      renderCell: (params: GridRenderCellParams) => {
        const reportId = params.row.id;
        return (
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleReplyClick(reportId)}
          >
            Reply
          </Button>
        );
      },
    }
  ];

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
          rows={filteredReports}
          columns={columns}
          slots={{ toolbar: GridToolbar }}
          getRowId={(row) => row.id}
          resizeThrottleMs={0}
          loading={loading}
          autoHeight
        />
      </Box>
    </Box>
  );
};

export default AdminReportList;