import React, { useEffect, useState, useContext, useCallback, useMemo } from 'react';
import { 
  Box, 
  Button, 
  useTheme, 
  Alert,
  Typography
} from "@mui/material";
import { DataGrid, GridColDef, GridToolbar, GridRenderCellParams } from "@mui/x-data-grid";
import { tokens } from "../../theme/theme";
import { SearchContext } from "../../components/layout/SearchContext";
import { useSettingsStore } from "../../stores/settings-store";
import { apiClient } from "../../api";
import { useNavigate } from 'react-router-dom';
import { useWebSocketChannel } from "../../hooks/useWebSocketChannel";
import { FaSync } from "react-icons/fa";

interface ReportWithReplies {
  id: number | string;
  from_student_username: string;
  report_type: string;
  subject: string;
  latest_reply: string;
  reply_count: number;
  latest_reply_date: string;
  [key: string]: any; 
}

interface DataGridContainerProps {
  reports: ReportWithReplies[];
  columns: GridColDef[];
  loading: boolean;
  colors: ReturnType<typeof tokens>;
}

interface ErrorAlertProps {
  message: string;
}

interface HeaderProps {
  colors: ReturnType<typeof tokens>;
  isConnected: boolean;
  onRefresh: () => void;
}

interface ActionButtonProps {
  reportId: string | number;
  onClick: (id: string | number) => void;
}

const Header: React.FC<HeaderProps> = ({ colors, isConnected, onRefresh }) => {
  return (
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
      <Typography
        variant="h1"
        sx={{
          color: colors.grey[100],
          fontSize: "1.75rem",
          fontWeight: 800,
        }}
      >
        Reports With Replies
      </Typography>
      
      <Box display="flex" alignItems="center">
        <Box
          component="span"
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: isConnected ? colors.greenAccent[500] : colors.orangeAccent[500],
            mr: 1
          }}
        />
        <Typography variant="body2" fontSize="0.75rem" color={colors.grey[300]} mr={2}>
          {isConnected ? 'Live updates' : 'Offline mode'}
        </Typography>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<FaSync />}
          onClick={onRefresh}
          size="small"
          sx={{ borderRadius: "8px" }}
        >
          Refresh
        </Button>
      </Box>
    </Box>
  );
};

const filterReportsBySearchTerm = (reports: ReportWithReplies[], searchTerm: string): ReportWithReplies[] => {
  if (!searchTerm) return reports;
  
  const normalizedSearchTerm = searchTerm.toLowerCase();
  
  return reports.filter((report) =>
    Object.values(report)
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearchTerm)
  );
};

const formatDateString = (dateStr: string): string => {
  try {
    return new Date(dateStr).toLocaleString();
  } catch (e) {
    return "Invalid date";
  }
};

const fetchReportReplies = async (): Promise<ReportWithReplies[]> => {
  try {
    const response = await apiClient.get("/api/admin/reports-replied");
    return response.data || [];
  } catch (error) {
    console.error("Error fetching reports with replies:", error);
    throw error;
  }
};

const ErrorAlert: React.FC<ErrorAlertProps> = ({ message }) => {
  return (
    <Alert severity="error" sx={{ mb: 2 }}>
      {message}
    </Alert>
  );
};

const FullPageErrorAlert: React.FC<ErrorAlertProps> = ({ message }) => {
  return (
    <Box p={2} display="flex" justifyContent="center">
      <Alert severity="error">{message}</Alert>
    </Box>
  );
};

const ActionButton: React.FC<ActionButtonProps> = ({ reportId, onClick }) => {
  return (
    <Button
      variant="contained"
      color="primary"
      onClick={() => onClick(reportId)}
      size="small"
    >
      View Thread
    </Button>
  );
};

const DataGridContainer: React.FC<DataGridContainerProps> = ({ reports, columns, loading, colors }) => {
  return (
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
  );
};

const createReportColumns = (
  handleViewThread: (id: string | number) => void,
): GridColDef[] => {
  return [
    { field: "id", headerName: "ID", flex: 0.5 },
    { field: "from_student_username", headerName: "Reporter", flex: 1 },
    { field: "report_type", headerName: "Report Type", flex: 1 },
    { field: "subject", headerName: "Subject", flex: 1.5 },
    { 
      field: "latest_reply", 
      headerName: "Latest Reply", 
      flex: 2,
    },
    { field: "reply_count", headerName: "Total Replies", flex: 0.8 },
    {
      field: "latest_reply_date",
      headerName: "Latest Reply Date",
      flex: 1.5,
      valueFormatter: (params: { value: string }) => formatDateString(params.value),
    },
    {
      field: "action",
      headerName: "Actions",
      flex: 1,
      sortable: false,
      filterable: false,
      minWidth: 140,
      width: 140,
      renderCell: (params: GridRenderCellParams) => (
        <ActionButton reportId={params.row.id} onClick={handleViewThread} />
      ),
    }
  ];
};

const ReportRepliedList: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const { searchTerm } = useContext(SearchContext);
  const { drawer } = useSettingsStore();
  
  
  const { 
    data: reports, 
    loading, 
    error, 
    refresh, 
    isConnected 
  } = useWebSocketChannel<ReportWithReplies[]>(
    'admin/reports', 
    fetchReportReplies
  );
  
  
  useEffect(() => {
    if (error) {
      console.error(`WebSocket error: ${error}`);
    }
  }, [error]);
  
  const handleViewThread = useCallback((reportId: string | number) => {
    navigate(`/admin/report-thread/${reportId}`);
  }, [navigate]);
  
  const filteredReports = useMemo(() => 
    filterReportsBySearchTerm(reports || [], searchTerm || ''),
    [reports, searchTerm]
  );
  
  const columns = useMemo(() => 
    createReportColumns(handleViewThread),
    [handleViewThread]
  );
  
  if (error && (!reports || reports.length === 0)) {
    return <FullPageErrorAlert message={error} />;
  }
  
  return (
    <Box
      sx={{
        height: "calc(100vh - 64px)",
        maxWidth: drawer ? `calc(100% - 3px)` : "100%",
      }}
    >
      <Header 
        colors={colors}
        isConnected={isConnected}
        onRefresh={refresh}
      />
      
      {error && <ErrorAlert message={error} />}
      
      <DataGridContainer 
        reports={filteredReports}
        columns={columns}
        loading={loading}
        colors={colors}
      />
    </Box>
  );
};

export default ReportRepliedList;