// src/pages/student/StudentReports.tsx
import React, { useEffect, useState } from 'react';
import { Box, Typography, useTheme, Tabs, Tab, Paper } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../theme/theme";
import { apiClient } from "../../api";
import { useNavigate } from 'react-router-dom';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ViewReports: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [myReports, setMyReports] = useState<any[]>([]);
  const [reportsWithReplies, setReportsWithReplies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        // Fetch all reports submitted by the student
        const reportsResponse = await apiClient.get("/api/my-reports");
        setMyReports(reportsResponse.data);
        
        // Fetch reports that have replies
        const repliesResponse = await apiClient.get("/api/my-reports-with-replies");
        setReportsWithReplies(repliesResponse.data);
        
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch reports");
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const reportsColumns = [
    { field: "id", headerName: "ID", flex: 0.5 },
    { field: "report_type", headerName: "Report Type", flex: 1 },
    { field: "subject", headerName: "Subject", flex: 1.5 },
    { field: "details", headerName: "Details", flex: 2 },
    {
      field: "requested_at",
      headerName: "Submitted On",
      flex: 1,
      renderCell: (params: any) => new Date(params.row.requested_at).toLocaleString(),
    },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      renderCell: (params: any) => {
        const hasReplies = reportsWithReplies.some(report => report.id === params.row.id);
        return (
          <Typography
            sx={{
              color: hasReplies ? colors.greenAccent[500] : colors.grey[500],
              fontWeight: hasReplies ? 'bold' : 'normal',
            }}
          >
            {hasReplies ? "Replied" : "Pending"}
          </Typography>
        );
      },
    },
    {
      field: "action",
      headerName: "Actions",
      flex: 1,
      renderCell: (params: any) => {
        const hasReplies = reportsWithReplies.some(report => report.id === params.row.id);
        return (
          <Box>
            {hasReplies ? (
              <Typography 
                variant="body2" 
                color={colors.blueAccent[500]} 
                sx={{ cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => navigate(`/student/report-thread/${params.row.id}`)}
              >
                View Thread
              </Typography>
            ) : (
              <Typography variant="body2" color={colors.grey[500]}>No replies yet</Typography>
            )}
          </Box>
        );
      },
    },
  ];

  const repliesColumns = [
    { field: "id", headerName: "ID", flex: 0.5 },
    { field: "report_type", headerName: "Report Type", flex: 1 },
    { field: "subject", headerName: "Subject", flex: 1.5 },
    { field: "latest_reply", headerName: "Latest Reply", flex: 2 },
    { field: "reply_count", headerName: "Total Replies", flex: 1 },
    {
      field: "latest_reply_date",
      headerName: "Latest Reply Date",
      flex: 1.5,
      renderCell: (params: any) => new Date(params.row.latest_reply_date).toLocaleString(),
    },
    {
      field: "action",
      headerName: "View",
      flex: 1,
      renderCell: (params: any) => (
        <Typography
          variant="body2"
          color={colors.blueAccent[500]}
          sx={{ cursor: 'pointer', textDecoration: 'underline' }}
          onClick={() => navigate(`/student/report-thread/${params.row.id}`)}
        >
          View Thread
        </Typography>
      ),
    },
  ];

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Typography
        variant="h2"
        fontWeight="bold"
        mb={3}
        sx={{
          color: theme.palette.mode === "dark" ? colors.grey[100] : "#141b2d",
          pl: 3,
          pt: 3,
        }}
      >
        My Reports
      </Typography>

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs 
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          centered
        >
          <Tab label="All Reports" />
          <Tab label="Reports with Replies" />
        </Tabs>
      </Paper>

      <TabPanel value={tabValue} index={0}>
        <Box
          sx={{
            height: "70vh",
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
          }}
        >
          <DataGrid
            rows={myReports}
            columns={reportsColumns}
            loading={loading}
            getRowId={(row) => row.id}
          />
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Box
          sx={{
            height: "70vh",
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
          }}
        >
          <DataGrid
            rows={reportsWithReplies}
            columns={repliesColumns}
            loading={loading}
            getRowId={(row) => row.id}
          />
        </Box>
      </TabPanel>
    </Box>
  );
};

export default ViewReports;