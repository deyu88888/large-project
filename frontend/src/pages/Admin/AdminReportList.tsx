import { useEffect, useState, useContext, useCallback, FC } from 'react';
import { Box, Button, useTheme, Typography } from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams, GridToolbar } from "@mui/x-data-grid";
import { tokens } from "../../theme/theme";
import { SearchContext } from "../../components/layout/SearchContext";
import { useSettingsStore } from "../../stores/settings-store";
import { fetchReports } from './fetchReports';
import { Report } from '../../types/president/report';
import { useNavigate } from 'react-router-dom';
import { useWebSocketChannel } from "../../hooks/useWebSocketChannel";
import { FaSync } from "react-icons/fa";

interface DataGridContainerProps {
  filteredReports: Report[];
  columns: GridColDef[];
  loading: boolean;
  colors: any;
}

interface ActionButtonProps {
  reportId: string;
  isPublic: boolean;
  email: string;
  subject: string;
  onReply: (id: string) => void;
}

interface HeaderProps {
  colors: any;
  isConnected: boolean;
  onRefresh: () => void;
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString();
};

const createMailtoUrl = (email: string, subject: string): string => {
  const emailSubject = encodeURIComponent(`Response to your report: "${subject}"`);
  const emailBody = encodeURIComponent("Hi,\n\nRegarding your report, we would like to get in touch with you.\n\nKind regards,\nAdmin Team");
  
  return `mailto:${email}?subject=${emailSubject}&body=${emailBody}`;
};

const Header: FC<HeaderProps> = ({ colors, isConnected, onRefresh }) => {
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
        Manage Reports
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

const ActionButton: FC<ActionButtonProps> = ({
  reportId,
  isPublic,
  email,
  subject,
  onReply
}) => {
  if (isPublic && email) {
    return (
      <Button
        variant="contained"
        color="secondary"
        href={createMailtoUrl(email, subject)}
      >
        Email Reply
      </Button>
    );
  }

  return (
    <Button
      variant="contained"
      color="primary"
      onClick={() => onReply(reportId)}
    >
      Reply
    </Button>
  );
};

const DataGridContainer: FC<DataGridContainerProps> = ({
  filteredReports,
  columns,
  loading,
  colors
}) => {
  const getDataGridStyles = () => ({
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
  });

  return (
    <Box sx={getDataGridStyles()}>
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
  );
};

const EmailCell: FC<{ email: string | null }> = ({ email }) => {
  if (!email) return <>-</>;
  
  return (
    <a href={`mailto:${email}`}>
      {email}
    </a>
  );
};

const ReporterCell: FC<{ reporter: string | null }> = ({ reporter }) => {
  return <>{reporter || "Public User"}</>;
};

const DateCell: FC<{ date: string }> = ({ date }) => {
  return <>{formatDate(date)}</>;
};

/**
 * AdminReportList component displays a list of reports with filtering and reply actions
 */
const AdminReportList: FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();  
  const { searchTerm } = useContext(SearchContext);
  const { drawer } = useSettingsStore(); 

  
  const fetchReportsWS = async () => {
    try {
      const data = await fetchReports();
      return data;
    } catch (error) {
      console.error("Failed to fetch reports:", error);
      return [];
    }
  };

  
  const { 
    data: reports, 
    loading, 
    error,
    refresh, 
    isConnected 
  } = useWebSocketChannel<Report[]>(
    'dashboard_stats', 
    fetchReportsWS
  );

  
  useEffect(() => {
    if (error) {
      console.error(`WebSocket error: ${error}`);
    }
  }, [error]);

  const handleReplyClick = useCallback((reportId: string) => {
    navigate(`/admin/report-list/${reportId}/reply`);
  }, [navigate]);

  
  const getFilteredReports = useCallback(() => {
    
    if (!reports || !Array.isArray(reports)) return [];
    
    return reports.filter((report) =>
      Object.values(report)
        .join(" ")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [reports, searchTerm]);

  const getColumns = useCallback((): GridColDef[] => [
    { field: "id", headerName: "ID", flex: 0.5 },
    {
      field: "from_student",
      headerName: "Reporter",
      flex: 1,
      renderCell: (params: GridRenderCellParams) => (
        <ReporterCell reporter={params.row.from_student} />
      ),
    },
    {
      field: "email",
      headerName: "Email",
      flex: 1,
      renderCell: (params: GridRenderCellParams) => (
        <EmailCell email={params.row.email} />
      ),
    },    
    { field: "report_type", headerName: "Report Type", flex: 1 },
    { field: "subject", headerName: "Subject", flex: 1.5 },
    { field: "details", headerName: "Details", flex: 2 },
    {
      field: "requested_at",
      headerName: "Requested At",
      flex: 1.5,
      renderCell: (params: GridRenderCellParams) => (
        <DateCell date={params.row.created_at} />
      ),
    },
    {
      field: "action", 
      headerName: "Actions",
      flex: 1,
      renderCell: (params: GridRenderCellParams) => (
        <ActionButton
          reportId={params.row.id}
          isPublic={!params.row.from_student}
          email={params.row.email}
          subject={params.row.subject}
          onReply={handleReplyClick}
        />
      ),
    }
  ], [handleReplyClick]);
  
  const getContainerStyles = useCallback(() => ({
    height: "calc(100vh - 64px)",
    maxWidth: drawer ? `calc(100% - 3px)`: "100%",
  }), [drawer]);
  
  const filteredReports = getFilteredReports();
  const columns = getColumns();

  return (
    <Box sx={getContainerStyles()}>
      <Header 
        colors={colors}
        isConnected={isConnected} 
        onRefresh={refresh}
      />
      
      <DataGridContainer 
        filteredReports={filteredReports}
        columns={columns}
        loading={loading}
        colors={colors}
      />
    </Box>
  );
};

export default AdminReportList;