import React, { useEffect, useState, useContext, useCallback } from "react";
import { Box, useTheme, Button, Alert, Snackbar } from "@mui/material";
import { DataGrid, GridRenderCellParams, GridToolbar } from "@mui/x-data-grid";
import { apiClient, apiPaths } from "../../api";
import { tokens } from "../../theme/theme";
import { useSettingsStore } from "../../stores/settings-store";
import { SearchContext } from "../../components/layout/SearchContext";
import { SocietyPreview } from "../../components/SocietyPreview";
import { EventPreview } from "../../components/EventPreview";

export interface SocietyDetailRequest {
  id: number;
  society: number;
  name: string;
  description: string;
  category: string;
  social_media_links: Record<string, string>;
  tags: string[];
  icon: string | null;
  membership_requirements: string | null;
  upcoming_projects_or_plans: string | null;
  intent: string;
  approved: boolean;
  created_at: string;
  vice_president?: number | null;
  event_manager?: number | null;
  president?: number | null;
  approved_by?: number | null;
  status: "Pending" | "Approved" | "Rejected"; 
  preview_requested?: boolean;
  from_
}

interface AlertState {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
}

const fetchPendingSocietyDetailRequests = async () => {
  try {
    const response = await apiClient.get(apiPaths.SOCIETY.DETAIL_REQUEST);
    return response.data.filter((request: SocietyDetailRequest) => 
      request.intent === "UpdateSoc" && !request.approved
    );
  } catch (error) {
    console.error("Error fetching society detail requests:", error);
    return [];
  }
};

const PendingSocietyDetailRequests: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { searchTerm } = useContext(SearchContext);
  const { drawer } = useSettingsStore();
  const [openPreview, setOpenPreview] = useState<boolean>(false);
  const [selectedRequest, setSelectedRequest] = useState<SocietyDetailRequest | null>(null);
  const [detailRequests, setDetailRequests] = useState<SocietyDetailRequest[]>([]);

  const fetchData = async () => {
    const data = await fetchPendingSocietyDetailRequests();
    setDetailRequests(data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredDetailRequests = Array.isArray(detailRequests)
    ? detailRequests.filter((request) => {
        const searchString = Object.entries(request)
          .map(([key, value]) => Array.isArray(value) ? value.join(", ") : String(value))
          .join(" ")
          .toLowerCase();
        return searchString.includes(searchTerm.toLowerCase());
      }).map((request) => ({
        ...request,
        society: request.society?.name,
        requested_by: request.from_student?.username,
      }))
    : [];

  const handlePreview = (id: number) => {
  };

  const handlePreviewClose = () => {
    setOpenPreview(false);
    setSelectedRequest(null);
  };

  const handleAccept = async (id: number) => {
    try {
      await apiClient.put(`${apiPaths.SOCIETY.DETAIL_REQUEST}${id}/`, { status: "Approved" });
      setDetailRequests((prev) => prev.filter((request) => request.id !== id));
      setAlert({
        open: true,
        message: `Society detail request approved successfully.`,
        severity: 'success'
      });
    } catch (error) {
      console.error("Error accepting society detail request:", error);
      setAlert({
        open: true,
        message: `Failed to approve society detail request.`,
        severity: 'error'
      });
    }
  };

  const handleReject = async (id: number) => {
    try {
      await apiClient.put(`${apiPaths.SOCIETY.DETAIL_REQUEST}${id}/`, { status: "Rejected" });
      setDetailRequests((prev) => prev.filter((request) => request.id !== id));
      setAlert({
        open: true,
        message: `Society detail request rejected successfully.`,
        severity: 'success'
      });
    } catch (error) {
      console.error("Error rejecting society detail request:", error);
      setAlert({
        open: true,
        message: `Failed to reject society detail request.`,
        severity: 'error'
      });
    }
  };

  // State for alerts/notifications
  const [alert, setAlert] = useState<AlertState>({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleCloseAlert = useCallback(() => {
    setAlert(prev => ({ ...prev, open: false }));
  }, []);

  const columns = [
    { field: "id", headerName: "ID", flex: 0.3 },
    { 
      field: "from_student", 
      headerName: "Requested By", 
      flex: 0.5,
    },
    { 
      field: "name", 
      headerName: "New Name", 
      flex: 1,
      renderCell: (params: GridRenderCellParams) => 
        params.row.name || "No name change",
    },
    { 
      field: "description", 
      headerName: "New Description", 
      flex: 2,
      renderCell: (params: GridRenderCellParams) => 
        params.row.description || "No description change",
    },
    {
      field: "requested_at",
      headerName: "Requested At",
      flex: 1,
      renderCell: (params: GridRenderCellParams) => {
        const date = new Date(params.row.requested_at);
        return isNaN(date.getTime()) ? "Invalid Date" : date.toLocaleString();
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 285,
      minWidth: 285,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams) => (
        <>
          <Button
            variant="contained"
            color="primary"
            onClick={() => handlePreview(params.row.id)}
            sx={{ marginRight: 1 }}
          >
            Preview
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => handleAccept(params.row.id)}
            sx={{ marginRight: 1 }}
          >
            Accept
          </Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={() => handleReject(params.row.id)}
          >
            Reject
          </Button>
        </>
      ),
      flex: 1.6,
    },    
  ];

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
          rows={filteredDetailRequests}
          columns={columns}
          slots={{ toolbar: GridToolbar }}
          autoHeight
          resizeThrottleMs={0}
          disableRowSelectionOnClick
        />
      </Box>

      {selectedRequest && (
        <SocietyPreview
          open={openPreview}
          onClose={handlePreviewClose}
          society={{
            ...selectedRequest,
            id: selectedRequest.id,
            from_student: {
              first_name: selectedRequest.name?.split(' ')[0] || 'Society',
              last_name: selectedRequest.name?.split(' ')[1] || 'Admin',
              username: 'admin',
            },
            icon: selectedRequest.icon || selectedRequest.icon,
            joined: 0,
          }}
          loading={false} joined={0} onJoinSociety={function (societyId: number): void {
            throw new Error("Function not implemented.");
          } }        />
      )}

      {/* Alert for success/failure messages */}
      <Snackbar 
        open={alert.open} 
        autoHideDuration={6000} 
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseAlert} 
          severity={alert.severity} 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {alert.message}
        </Alert>
      </Snackbar>

      {selectedRequest && (
        <EventPreview
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          eventData={selectedRequest}
        />
      )}
    </Box>
  );
};

export default PendingSocietyDetailRequests;