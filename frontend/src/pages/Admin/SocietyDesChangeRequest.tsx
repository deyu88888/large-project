import React, { useEffect, useState, useContext, useCallback, useMemo } from "react";
import { Box, Typography, useTheme, Button } from "@mui/material";
import { DataGrid, GridRenderCellParams, GridToolbar, GridColDef } from "@mui/x-data-grid";
import { apiClient, apiPaths } from "../../api";
import { tokens } from "../../theme/theme";
import { useSettingsStore } from "../../stores/settings-store";
import { fetchPendingDescriptions } from "./fetchPendingDescriptions";
import { useFetchWebSocket } from "../../hooks/useFetchWebSocket";
import { SearchContext } from "../../components/layout/SearchContext";


interface Society {
  id: number;
  name: string;
}

interface User {
  id: number;
  username: string;
}

interface DescriptionRequest {
  id: number;
  society: Society;
  requested_by: User;
  new_description: string;
  created_at: string;
}

interface DisplayableDescription {
  id: number;
  society: string;
  requested_by: string;
  new_description: string;
  created_at: string;
}

interface ActionButtonsProps {
  id: number;
  onAccept: (id: number) => void;
  onReject: (id: number) => void;
}

interface DataGridContainerProps {
  descriptions: DisplayableDescription[];
  columns: GridColDef[];
  colors: ReturnType<typeof tokens>;
  drawer: boolean;
}


const transformDescriptionForDisplay = (description: DescriptionRequest): DisplayableDescription => {
  return {
    ...description,
    society: description.society?.name || '',
    requested_by: description.requested_by?.username || '',
  };
};

const filterDescriptionsBySearchTerm = (
  descriptions: DescriptionRequest[],
  searchTerm: string
): DescriptionRequest[] => {
  if (!searchTerm) return descriptions;
  
  const normalizedSearchTerm = searchTerm.toLowerCase();
  
  return descriptions.filter((description) => {
    const searchString = Object.entries(description)
      .map(([key, value]) => Array.isArray(value) ? value.join(", ") : String(value))
      .join(" ")
      .toLowerCase();
    return searchString.includes(normalizedSearchTerm);
  });
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString();
};


const acceptDescription = async (id: number): Promise<void> => {
  await apiClient.put(`${apiPaths.USER.PENDINGDESCRIPTIONREQUEST}/${id}`, { status: "Approved" });
};

const rejectDescription = async (id: number): Promise<void> => {
  await apiClient.put(`${apiPaths.USER.PENDINGDESCRIPTIONREQUEST}/${id}`, { status: "Rejected" });
};

const fetchDescriptionRequests = async (): Promise<DescriptionRequest[]> => {
  const res = await apiClient.get(apiPaths.USER.PENDINGDESCRIPTIONREQUEST);
  return res.data;
};


const ActionButtons: React.FC<ActionButtonsProps> = ({ id, onAccept, onReject }) => {
  return (
    <>
      <Button
        variant="contained"
        color="success"
        onClick={() => onAccept(id)}
        sx={{ marginRight: 1 }}
      >
        Accept
      </Button>
      <Button 
        variant="contained" 
        color="error" 
        onClick={() => onReject(id)}
      >
        Reject
      </Button>
    </>
  );
};

const DataGridContainer: React.FC<DataGridContainerProps> = ({ 
  descriptions, 
  columns, 
  colors, 
  drawer 
}) => {
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
          rows={descriptions}
          columns={columns}
          slots={{ toolbar: GridToolbar }}
          autoHeight
          resizeThrottleMs={0}
          disableRowSelectionOnClick
        />
      </Box>
    </Box>
  );
};


const createDescriptionColumns = (
  onAccept: (id: number) => void,
  onReject: (id: number) => void
): GridColDef[] => {
  return [
    { field: "id", headerName: "ID", flex: 0.5 },
    { field: "society", headerName: "Society", flex: 1 },
    { field: "requested_by", headerName: "Requested By", flex: 1 },
    { field: "new_description", headerName: "New Description", flex: 2 },
    {
      field: "created_at",
      headerName: "Requested At",
      flex: 1,
      renderCell: (params: GridRenderCellParams) => formatDate(params.value as string),
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1.6,
      renderCell: (params: GridRenderCellParams) => (
        <ActionButtons 
          id={params.row.id} 
          onAccept={onAccept} 
          onReject={onReject} 
        />
      ),
    },
  ];
};


const PendingDescriptionRequest: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { searchTerm } = useContext(SearchContext);
  const { drawer } = useSettingsStore();
  
  
  const [requests, setRequests] = useState<DescriptionRequest[]>([]);
  
  
  const descriptions = useFetchWebSocket<DescriptionRequest[]>(fetchPendingDescriptions, 'description');

  
  useEffect(() => {
    loadDescriptionRequests();
  }, []);

  
  const loadDescriptionRequests = async () => {
    try {
      const data = await fetchDescriptionRequests();
      setRequests(data);
    } catch (error) {
      console.error("Error fetching description requests:", error);
    }
  };

  
  const handleAccept = useCallback(async (id: number) => {
    try {
      await acceptDescription(id);
    } catch (error) {
      console.error("Error accepting description:", error);
    }
  }, []);

  const handleReject = useCallback(async (id: number) => {
    try {
      await rejectDescription(id);
    } catch (error) {
      console.error("Error rejecting description:", error);
    }
  }, []);

  
  const processedDescriptions = useMemo(() => {
    if (!Array.isArray(descriptions)) return [];
    
    const filteredData = filterDescriptionsBySearchTerm(descriptions, searchTerm || '');
    return filteredData.map(transformDescriptionForDisplay);
  }, [descriptions, searchTerm]);

  
  const columns = useMemo(() => 
    createDescriptionColumns(handleAccept, handleReject),
    [handleAccept, handleReject]
  );

  return (
    <DataGridContainer
      descriptions={processedDescriptions}
      columns={columns}
      colors={colors}
      drawer={drawer}
    />
  );
};

export default PendingDescriptionRequest;