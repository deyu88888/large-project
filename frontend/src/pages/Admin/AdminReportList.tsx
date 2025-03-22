import React, { useEffect, useState, useContext } from 'react';
import { Box, Button, Typography, useTheme } from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { tokens } from "../../theme/theme";
import { SearchContext } from "../../components/layout/SearchContext";
import { useSettingsStore } from "../../stores/settings-store";
import { fetchReports } from './fetchReports';
import { Report } from '../../types'
import { useNavigate } from 'react-router-dom';


const AdminReportList: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [reports, setReports] = useState<Report[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { searchTerm } = useContext(SearchContext);
  const { drawer } = useSettingsStore(); 
  const navigate = useNavigate(); // Use the navigate hook for routing

  useEffect(() => {
    const loadReports = async () => {
      try {
        const data = await fetchReports();
        setReports(data);
      } catch (error) {
        setError("Failed to fetch reports.");
      }
    };

    loadReports();
  }, []);

  if (error) {
    return <div>Error: {error}</div>;
  }

  const filteredReports = reports.filter((report) =>
    Object.values(report)
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );   
  
  const columns = [
    { field: "id", headerName: "ID", flex: 0.5 },
    { field: "from_student", headerName: "Reporter", flex: 1 },
    { field: "report_type", headerName: "Report Type", flex: 1 },
    { field: "subject", headerName: "Subject", flex: 1.5 },
    { field: "details", headerName: "Details", flex: 2 },
    {
      field: "created_at",
      headerName: "Created At",
      flex: 1.5,
      renderCell: (params: any) => new Date(params.row.created_at).toLocaleString(),
    },
    {
      field: "action", // Action column for the reply button
      headerName: "Actions",
      flex: 1,
      renderCell: (params: any) => {
        const reportId = params.row.id;
        return (
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate(`/admin/report-list/${reportId}/reply`)} // Navigate to the reply page
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
          rows={reports}
          columns={columns}
          slots={{ toolbar: GridToolbar }}
          getRowId={(row) => row.id}
          resizeThrottleMs={0}
          autoHeight
        />
      </Box>
    </Box>
  );
};

export default AdminReportList;