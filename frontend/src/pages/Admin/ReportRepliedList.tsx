// src/pages/admin/ReportRepliedList.tsx
import React, { useEffect, useState, useContext } from 'react';
import { Box, Button, Typography, useTheme } from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { tokens } from "../../theme/theme";
import { SearchContext } from "../../components/layout/SearchContext";
import { useSettingsStore } from "../../stores/settings-store";
import { apiClient } from "../../api";
import { useNavigate } from 'react-router-dom';

const ReportRepliedList: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [reportsWithReplies, setReportsWithReplies] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { searchTerm } = useContext(SearchContext);
  const { drawer } = useSettingsStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReportsWithReplies = async () => {
      try {
        const response = await apiClient.get("/api/reports-replied");
        setReportsWithReplies(response.data);
      } catch (err) {
        setError("Failed to fetch reports with replies");
      }
    };

    fetchReportsWithReplies();
  }, []);

  const filteredReports = reportsWithReplies.filter((report) =>
    Object.values(report)
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const columns = [
    { field: "id", headerName: "ID", flex: 0.5 },
    { field: "from_student_username", headerName: "Reporter", flex: 1 },
    { field: "report_type", headerName: "Report Type", flex: 1 },
    { field: "subject", headerName: "Subject", flex: 1.5 },
    { field: "latest_reply", headerName: "Latest Reply", flex: 2 },
    { field: "reply_count", headerName: "Total Replies", flex: 0.8 },
    {
      field: "latest_reply_date",
      headerName: "Latest Reply Date",
      flex: 1.5,
      renderCell: (params: any) => new Date(params.row.latest_reply_date).toLocaleString(),
    },
    {
      field: "action",
      headerName: "Actions",
      flex: 1,
      renderCell: (params: any) => {
        return (
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate(`/admin/report-thread/${params.row.id}`)}
          >
            View Thread
          </Button>
        );
      },
    }
  ];

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Box
      sx={{
        height: "calc(100vh - 64px)",
        maxWidth: drawer ? `calc(100% - 3px)` : "100%",
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
          rows={reportsWithReplies}
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

export default ReportRepliedList;