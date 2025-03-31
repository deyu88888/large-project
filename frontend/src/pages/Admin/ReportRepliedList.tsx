import React, { useEffect, useState, useContext, useCallback, useMemo } from 'react';
import { 
  Box, 
  Button, 
  useTheme, 
  Alert 
} from "@mui/material";
import { DataGrid, GridColDef, GridToolbar, GridRenderCellParams } from "@mui/x-data-grid";
import { tokens } from "../../theme/theme";
import { SearchContext } from "../../components/layout/SearchContext";
import { useSettingsStore } from "../../stores/settings-store";
import { apiClient } from "../../api";
import { useNavigate } from 'react-router-dom';
import {
  ReportWithReplies,
  ReportState,
  DataGridContainerProps,
  ErrorAlertProps,
  ActionButtonProps
} from "../../types/admin/ReportRepliedList";

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
  const response = await apiClient.get("/api/admin/reports-replied");
  return response.data || [];
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
      renderCell: (params: GridRenderCellParams<any, any, any>) => {
        const value = params.row.latest_reply_date;
        return <div>{value ? formatDateString(value) : '-'}</div>;
      },
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
  
  
  const [reportState, setReportState] = useState<ReportState>({
    items: [],
    loading: true,
    error: null
  });

  
  const handleViewThread = useCallback((reportId: string | number) => {
    navigate(`/admin/report-thread/${reportId}`);
  }, [navigate]);

  const loadReportReplies = useCallback(async () => {
    setReportState(prev => ({ ...prev, loading: true }));
    
    try {
      const data = await fetchReportReplies();
      setReportState({
        items: data,
        loading: false,
        error: null
      });
    } catch (err) {
      console.error("Error fetching reports with replies:", err);
      setReportState({
        items: [],
        loading: false,
        error: "Failed to fetch reports with replies. Please try again."
      });
    }
  }, []);

  
  useEffect(() => {
    loadReportReplies();
  }, [loadReportReplies]);

  
  const filteredReports = useMemo(() => 
    filterReportsBySearchTerm(reportState.items, searchTerm || ''),
    [reportState.items, searchTerm]
  );

  
  const columns = useMemo(() => 
    createReportColumns(handleViewThread),
    [handleViewThread]
  );

  
  if (reportState.error && !reportState.items.length) {
    return <FullPageErrorAlert message={reportState.error} />;
  }

  
  return (
    <Box
      sx={{
        height: "calc(100vh - 64px)",
        maxWidth: drawer ? `calc(100% - 3px)` : "100%",
      }}
    >
      {reportState.error && <ErrorAlert message={reportState.error} />}
      
      <DataGridContainer 
        reports={filteredReports}
        columns={columns}
        loading={reportState.loading}
        colors={colors}
      />
    </Box>
  );
};

export default ReportRepliedList;