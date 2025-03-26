import { useState, useEffect, useContext, useRef, useCallback } from "react";
import { Box, useTheme } from "@mui/material";
import { DataGrid, GridColDef, GridToolbar } from "@mui/x-data-grid";
import { apiClient, apiPaths } from "../../api";
import { tokens } from "../../theme/theme";
import { SearchContext } from "../../components/layout/SearchContext";
import { useSettingsStore } from "../../stores/settings-store";
import { Event } from '../../types';


interface WebSocketRef {
  current: WebSocket | null;
}

interface TimeoutRef {
  current: NodeJS.Timeout | null;
}

interface DataGridProps {
  events: Event[];
  columns: GridColDef[];
  colors: ReturnType<typeof tokens>;
}


const WS_URL = "ws:";
const RECONNECT_DELAY = 5000;


const filterEventsBySearchTerm = (events: Event[], searchTerm: string): Event[] => {
  if (!searchTerm) return events;
  
  const normalizedSearchTerm = searchTerm.toLowerCase();
  
  return events.filter((event) =>
    Object.values(event)
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearchTerm)
  );
};

const createEventColumns = (): GridColDef[] => {
  return [
    { field: "id", headerName: "ID", flex: 0.5 },
    { field: "title", headerName: "Title", flex: 1 },
    { field: "main_description", headerName: "Description", flex: 2},
    { field: "date", headerName: "Date", flex: 1 },
    { field: "start_time", headerName: "Start Time", flex: 1 },
    { field: "duration", headerName: "Duration", flex: 1 },
    { field: "hosted_by", headerName: "Hosted By", flex: 1 },
    { field: "location", headerName: "Location", flex: 1 },
  ];
};


const fetchRejectedEvents = async (): Promise<Event[]> => {
  try {
    const res = await apiClient.get(apiPaths.EVENTS.REJECTEDEVENTLIST);
    return res.data || [];
  } catch (error) {
    console.error("Error fetching rejected events:", error);
    return [];
  }
};


const closeWebSocket = (ws: WebSocketRef): void => {
  if (ws.current) {
    ws.current.close();
  }
};

const clearReconnectTimeout = (timeoutRef: TimeoutRef): void => {
  if (timeoutRef.current) {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }
};

const setupWebSocketOnOpen = (ws: WebSocket): void => {
  ws.onopen = () => {
    console.log("WebSocket Connected for Rejected Events List");
  };
};

const setupWebSocketOnMessage = (ws: WebSocket, onUpdate: () => void): void => {
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log("WebSocket Update Received:", data);
      onUpdate();
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  };
};

const setupWebSocketOnError = (ws: WebSocket): void => {
  ws.onerror = (event) => {
    console.error("WebSocket Error:", event);
  };
};

const setupWebSocketOnClose = (
  ws: WebSocket,
  reconnectFn: () => void,
  reconnectTimeoutRef: TimeoutRef
): void => {
  ws.onclose = (event) => {
    console.log("WebSocket Disconnected:", event.reason);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectFn();
    }, RECONNECT_DELAY);
  };
};


const EventsDataGrid: React.FC<DataGridProps> = ({ events, columns, colors }) => {
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
          color: `${colors.greenAccent[200]} !important`,
        },
        "& .MuiDataGrid-toolbarContainer .MuiButton-text": {
          color: `${colors.blueAccent[500]} !important`,
        },
      }}
    >
      <DataGrid
        rows={events}
        columns={columns}
        slots={{ toolbar: GridToolbar }}
        resizeThrottleMs={0}
        autoHeight
        disableRowSelectionOnClick
        initialState={{
          pagination: { paginationModel: { pageSize: 100 } },
        }}
      />
    </Box>
  );
};

/**
 * EventListRejected component that displays a list of rejected events
 */
const EventListRejected: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { drawer } = useSettingsStore();
  const [events, setEvents] = useState<Event[]>([]);
  const loadingRef = useRef(true);
  const { searchTerm } = useContext(SearchContext);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);


  const loadEvents = useCallback(async () => {
    loadingRef.current=true;
    const data = await fetchRejectedEvents();
    setEvents(data);
    loadingRef.current=false;
    ;
  }, []);

  
  const connectWebSocket = useCallback(() => {
    
    closeWebSocket(ws);
    clearReconnectTimeout(reconnectTimeoutRef);
    
    
    ws.current = new WebSocket(WS_URL);
    
    
    if (ws.current) {
      setupWebSocketOnOpen(ws.current);
      setupWebSocketOnMessage(ws.current, loadEvents);
      setupWebSocketOnError(ws.current);
      setupWebSocketOnClose(ws.current, connectWebSocket, reconnectTimeoutRef);
    }
  }, [loadEvents]);

  
  useEffect(() => {
    loadEvents();
    connectWebSocket();
  
    
    return () => {
      closeWebSocket(ws);
      clearReconnectTimeout(reconnectTimeoutRef);
    };
  }, [loadEvents, connectWebSocket]);

  
  const filteredEvents = filterEventsBySearchTerm(events, searchTerm || "");

  const columns = createEventColumns();

  return (
    <Box
      sx={{
        height: "calc(100vh - 64px)",
        maxWidth: drawer ? `calc(100% - 3px)` : "100%",
      }}
    >
      <EventsDataGrid 
        events={filteredEvents}
        columns={columns}
        colors={colors}
      />
    </Box>
  );
};

export default EventListRejected;