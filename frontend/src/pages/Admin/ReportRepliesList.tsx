import React, { useEffect, useState, useContext } from 'react';
import { Box, Button, Typography, useTheme, Alert, Chip } from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { tokens } from "../../theme/theme";
import { SearchContext } from "../../components/layout/SearchContext";
import { useSettingsStore } from "../../stores/settings-store";
import { fetchReportsWithReplies } from './fetchReports';
import { ReportReply } from '../../types';
import { useNavigate } from 'react-router-dom';

const ReportRepliesList: React.FC = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const [reports, setReports] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const { searchTerm } = useContext(SearchContext);
    const { drawer } = useSettingsStore();
    const navigate = useNavigate();
  
    useEffect(() => {
      const loadReports = async () => {
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
      };
  
      loadReports();
      
      // Refresh data every 5 minutes
      const intervalId = setInterval(loadReports, 5 * 60 * 1000);
      
      return () => clearInterval(intervalId);
    }, []);
  
    // Filter reports based on search term
    const filteredReports = reports.filter((report) =>
      Object.values(report)
        .join(" ")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  
    const handleViewThread = (reportId) => {
      navigate(`/admin/report-thread/${reportId}`);
    };
  
    const handleReply = (reportId) => {
      navigate(`/admin/report-list/${reportId}/reply`);
    };
  
    const columns = [
      { field: "id", headerName: "ID", flex: 0.5 },
      { field: "subject", headerName: "Subject", flex: 1.5 },
      { field: "from_student_name", headerName: "From", flex: 1 },
      { 
        field: "latest_reply_content", 
        headerName: "Latest Reply", 
        flex: 2,
        renderCell: (params) => {
          return (
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {params.row.latest_reply.replied_by}:
              </Typography>
              <Typography variant="body2" noWrap>
                {params.row.latest_reply.content}
              </Typography>
            </Box>
          );
        }
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
        renderCell: (params) => {
          return new Date(params.row.latest_reply.created_at).toLocaleString();
        }
      },
      { 
        field: "requested_at", 
        headerName: "Report Date", 
        flex: 1.2,
        renderCell: (params) => new Date(params.row.requested_at).toLocaleString() 
      },
      {
        field: "actions",
        headerName: "Actions",
        flex: 1,
        renderCell: (params) => {
          return (
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
          );
        }
      }
    ];
  
    if (loading) {
      return <Typography>Loading reports...</Typography>;
    }
  
    return (
      <Box
        sx={{
          height: "calc(100vh - 64px)",
          maxWidth: drawer ? `calc(100% - 3px)`: "100%",
        }}
      > 
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
            slots={{ toolbar: GridToolbar }}
            getRowId={(row) => row.id}
            resizeThrottleMs={0}
            autoHeight
          />
        </Box>
      </Box>
    );
  };
  

export default ReportRepliesList;