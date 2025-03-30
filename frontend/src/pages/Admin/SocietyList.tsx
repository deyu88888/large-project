import { useState, useEffect, useRef, useContext, useMemo, useCallback } from "react";
import { Box, 
  Typography, 
  useTheme, 
  Button, 
  DialogContent,
  DialogTitle, 
  Dialog, 
  DialogContentText, 
  DialogActions, 
  TextField } from "@mui/material";
import { DataGrid, GridColDef, GridToolbar, GridRenderCellParams } from "@mui/x-data-grid";
import { apiClient, apiPaths } from "../../api";
import { tokens } from "../../theme/theme";
import { useSettingsStore } from "../../stores/settings-store";
import { SearchContext } from "../../components/layout/SearchContext";
import { Society } from '../../types';
import { useNavigate } from "react-router-dom";
import { getWebSocketUrl } from "../../utils/websocket";


const WS_URL = getWebSocketUrl()
const RECONNECT_DELAY = 5000;


interface SocietyDialogState {
  open: boolean;
  reason: string;
  selectedSociety: Society | null;
}

interface WebSocketRef {
  current: WebSocket | null;
}

interface ActionButtonsProps {
  societyId: string | number;
  onView: (id: string) => void;
  onDelete: (society: Society) => void;
  society: Society;
}

interface DataGridContainerProps {
  societies: Society[];
  columns: GridColDef[];
  colors: ReturnType<typeof tokens>;
  drawer: boolean;
}

interface DeleteDialogProps {
  state: SocietyDialogState;
  onClose: () => void;
  onReasonChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onConfirm: () => void;
}

interface PresidentCellProps {
  president: {
    first_name: string;
    last_name: string;
  } | null;
}

interface MembersCellProps {
  members: any[] | null;
}


const filterSocietiesBySearchTerm = (societies: Society[], searchTerm: string): Society[] => {
  if (!searchTerm) return societies;
  
  const normalizedSearchTerm = searchTerm.toLowerCase();
  
  return societies.filter((society) =>
    Object.values(society)
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearchTerm)
  );
};


const fetchSocietyList = async (): Promise<Society[]> => {
  const res = await apiClient.get(apiPaths.USER.SOCIETY);
  return res.data;
};

const deleteSociety = async (societyId: number | string, reason: string): Promise<void> => {
  await apiClient.request({
    method: "DELETE",
    url: apiPaths.USER.DELETE("Society", Number(societyId)),
    data: { reason },
  });
};


const setupWebSocketHandlers = (
  socket: WebSocket,
  onMessage: () => void
): void => {
  socket.onopen = () => {
    console.log("WebSocket Connected for Society List");
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log("WebSocket Update Received:", data);
      onMessage();
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  };

  socket.onerror = (event) => {
    console.error("WebSocket Error:", event);
  };
};

const createWebSocketConnection = (
  url: string,
  onMessage: () => void,
  onClose: () => void
): WebSocket => {
  const socket = new WebSocket(url);
  setupWebSocketHandlers(socket, onMessage);
  
  socket.onclose = (event) => {
    console.log("WebSocket Disconnected:", event.reason);
    onClose();
  };
  
  return socket;
};


const PresidentCell: React.FC<PresidentCellProps> = ({ president }) => {
  return (
    <Typography>
      {president ? `${president.first_name} ${president.last_name}` : "N/A"}
    </Typography>
  );
};

const MembersCell: React.FC<MembersCellProps> = ({ members }) => {
  return (
    <Typography>
      {Array.isArray(members) ? members.length : "0"}
    </Typography>
  );
};

const ActionButtons: React.FC<ActionButtonsProps> = ({ 
  societyId, 
  onView, 
  onDelete,
  society
}) => {
  return (
    <Box>
      <Button
        variant="contained"
        color="primary"
        onClick={() => onView(societyId.toString())}
        sx={{ marginRight: "8px" }}
      >
        View
      </Button>
      <Button
        variant="contained"
        color="error"
        onClick={() => onDelete(society)}
      >
        Delete
      </Button>
    </Box>
  );
};

const DataGridContainer: React.FC<DataGridContainerProps> = ({ 
  societies, 
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
          rows={societies}
          columns={columns}
          slots={{ toolbar: GridToolbar }}
          autoHeight
          resizeThrottleMs={0}
        />
      </Box>
    </Box>
  );
};

const DeleteDialog: React.FC<DeleteDialogProps> = ({ 
  state, 
  onClose, 
  onReasonChange, 
  onConfirm 
}) => {
  const { open, reason, selectedSociety } = state;
  const isConfirmDisabled = !reason.trim();
  
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>
        Please confirm that you would like to delete {selectedSociety?.name}.
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          You may undo this action in the Activity Log. <br />
          <strong>Compulsory:</strong> Provide a reason for deleting this student.
        </DialogContentText>
        <TextField
          autoFocus
          label="Reason for Deletion"
          fullWidth
          variant="standard"
          value={reason}
          onChange={onReasonChange}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button 
          onClick={onConfirm} 
          color="error"
          disabled={isConfirmDisabled}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
};


const createSocietyColumns = (
  handleViewSociety: (id: string) => void,
  handleOpenDialog: (society: Society) => void
): GridColDef[] => {
  return [
    { field: "id", headerName: "ID", flex: 0.3 },
    { field: "name", headerName: "Name", flex: 1 },
    { field: "description", headerName: "Description", flex: 1 },
    {
      field: "president",
      headerName: "President",
      flex: 0.8,
      renderCell: (params: GridRenderCellParams) => (
        <PresidentCell president={params.value} />
      ),
    },
    {
      field: "society_members",
      headerName: "Members",
      flex: 0.5,
      renderCell: (params: GridRenderCellParams) => (
        <MembersCell members={params.value} />
      ),
    },
    { field: "approved_by", headerName: "Approved By", flex: 0.5 },
    { field: "category", headerName: "Category", flex: 1.3 },
    {
      field: "actions",
      headerName: "Actions",
      width: 170,
      minWidth: 170,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams) => (
        <ActionButtons 
          societyId={params.row.id}
          society={params.row}
          onView={handleViewSociety}
          onDelete={handleOpenDialog}
        />
      ),
    },
  ];
};

/**
 * SocietyList Component
 * Displays a list of societies with options to view details or delete
 */
const SocietyList: React.FC = () => {
  
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const { drawer } = useSettingsStore();
  const { searchTerm } = useContext(SearchContext);
  const ws = useRef<WebSocket | null>(null);
  
  
  const [societies, setSocieties] = useState<Society[]>([]);
  const [dialogState, setDialogState] = useState<SocietyDialogState>({
    open: false,
    reason: '',
    selectedSociety: null
  });

  
  const loadSocieties = useCallback(async () => {
    try {
      const data = await fetchSocietyList();
      setSocieties(data);
    } catch (error) {
      console.error("Error fetching societies:", error);
    }
  }, []);

  
  const handleWebSocketMessage = useCallback(() => {
    loadSocieties();
  }, [loadSocieties]);

  const reconnectWebSocket = useCallback(() => {
    setTimeout(() => {
      connectWebSocket();
    }, RECONNECT_DELAY);
  }, []);

  const connectWebSocket = useCallback(() => {
    if (ws.current) {
      ws.current.close();
    }
    
    ws.current = createWebSocketConnection(
      WS_URL,
      handleWebSocketMessage,
      reconnectWebSocket
    );
  }, [handleWebSocketMessage, reconnectWebSocket]);

  
  useEffect(() => {
    loadSocieties();
    connectWebSocket();

    
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connectWebSocket, loadSocieties]);

  
  const handleViewSociety = useCallback((societyId: string) => {
    navigate(`/admin/view-society/${societyId}`);
  }, [navigate]);

  const handleOpenDialog = useCallback((society: Society) => {
    setDialogState({
      open: true,
      reason: '',
      selectedSociety: society
    });
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDialogState({
      open: false,
      reason: '',
      selectedSociety: null
    });
  }, []);

  const handleReasonChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setDialogState(prev => ({
      ...prev,
      reason: event.target.value
    }));
  }, []);

  const handleDeleteConfirmed = useCallback(async () => {
    const { selectedSociety, reason } = dialogState;
    
    if (!selectedSociety) return;
    
    try {
      await deleteSociety(selectedSociety.id, reason);
      loadSocieties();
    } catch (error) {
      console.error("Error deleting society:", error);
    }
    
    handleCloseDialog();
  }, [dialogState, loadSocieties, handleCloseDialog]);

  
  const filteredSocieties = useMemo(() => 
    filterSocietiesBySearchTerm(societies, searchTerm || ''),
    [societies, searchTerm]
  );

  const columns = useMemo(() => 
    createSocietyColumns(handleViewSociety, handleOpenDialog),
    [handleViewSociety, handleOpenDialog]
  );

  return (
    <>
      <DataGridContainer 
        societies={filteredSocieties}
        columns={columns}
        colors={colors}
        drawer={drawer}
      />
      
      <DeleteDialog 
        state={dialogState}
        onClose={handleCloseDialog}
        onReasonChange={handleReasonChange}
        onConfirm={handleDeleteConfirmed}
      />
    </>
  );
};

export default SocietyList;