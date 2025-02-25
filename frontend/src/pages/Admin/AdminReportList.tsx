import React, { useEffect, useState, useContext } from 'react';
import { Box, Typography, useTheme } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { apiClient, apiPaths } from "../../api";
import { tokens } from "../../theme/theme";
import { SearchContext } from "../../components/layout/SearchContext";
import { useSettingsStore } from "../../stores/settings-store";


interface Report {
    id: number;
    from_student: string;
    report_type: string;
    subject: string;
    details: string;
    created_at: string;
}

const AdminReport: React.FC = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const [reports, setReports] = useState<Report[]>([]);
    const [error, setError] = useState<string | null>(null);
    const { searchTerm } = useContext(SearchContext);
    const { drawer } = useSettingsStore(); 

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
      ];

    return (
        <Box
          sx={{
            height: "calc(100vh - 64px)",
            maxWidth: drawer ? `calc(100% - 3px)`: "100%",
          }}
        >
          <Typography
            variant="h1"
            sx={{
              color:
                theme.palette.mode === "light"
                  ? colors.grey[100]
                  : colors.grey[100],
              fontSize: "2.25rem",
              fontWeight: 800,
              marginBottom: "1rem",
            }}
          >
            Reports
          </Typography>
    
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
            }}
          >
            <DataGrid
              rows={reports}
              columns={columns}
              getRowId={(row) => row.id}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 5, page: 0 },
                },
              }}
              pageSizeOptions={[5, 10, 25]}
              checkboxSelection
            />
          </Box>
        </Box>
      );
    };
    
    export default AdminReport;    
