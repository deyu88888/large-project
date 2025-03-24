import {useContext, useEffect, useState} from "react";
import { Box, useTheme, Button } from "@mui/material";
import { DataGrid, GridColDef, GridToolbar } from "@mui/x-data-grid";
import { tokens } from "../../theme/theme";
import { SearchContext } from "../../components/layout/SearchContext";
import { useSettingsStore } from "../../stores/settings-store";
// import { useFetchWebSocket } from "../../hooks/useFetchWebSocket";
import { fetchPendingRequests } from "./utils"
import { apiPaths } from "../../api";
import { updateRequestStatus } from "../../api/requestApi";

const PendingEventRequest = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { searchTerm } = useContext(SearchContext);
  const { drawer } = useSettingsStore(); 
  // const events = useFetchWebSocket(() => fetchPendingRequests(apiPaths.EVENTS.PENDINGEVENTREQUEST), 'event');
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchPendingRequests(apiPaths.EVENTS.PENDINGEVENTREQUEST);
        setEvents(data);
      } catch (error) {
        console.error("Error fetching pending events:", error);
      }
    };
    fetchData();
  }, []);


  const filteredEvents = events.filter((event) =>
    Object.values(event)
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const handleStatusChange = async (id: number, status: "Approved" | "Rejected") => {
    try {
      await updateRequestStatus(id, status, apiPaths.EVENTS.UPDATEENEVENTREQUEST);
    } catch (error) {
      alert(`Failed to ${status.toLowerCase()} event.`);
    }
  };

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", flex: 0.5 },
    { field: "title", headerName: "Title", flex: 1 },
    { field: "description", headerName: "Description", flex: 2 },
    { field: "date", headerName: "Date", flex: 1 },
    { field: "startTime", headerName: "Start Time", flex: 1 },
    { field: "duration", headerName: "Duration", flex: 1 },
    { field: "hostedBy", headerName: "Hosted By", flex: 1 },
    { field: "location", headerName: "Location", flex: 1 },
    {
      field: "actions",
      headerName: "Actions",
      renderCell: (params: any) => (
        <>
          <Button
            variant="contained"
            color="success"
            onClick={() => handleStatusChange(params.row.id, "Approved")}
            sx={{ marginRight: 1 }}
          >
            Accept
          </Button>
          <Button variant="contained" color="error" onClick={() => handleStatusChange(params.row.id, "Rejected")}>
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
        height: "calc(100vh - 64px)", // Full height minus the AppBar height
        maxWidth: drawer ? `calc(100% - 3px)`: "100%",
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
          "& .MuiDataGrid-columnHeader": { whiteSpace: "normal", wordBreak: "break-word" },
          "& .MuiDataGrid-virtualScroller": { backgroundColor: colors.primary[400] },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "none",
            backgroundColor: colors.blueAccent[700],
          },
          "& .MuiDataGrid-toolbarContainer .MuiButton-text": {
            color: `${colors.blueAccent[500]} !important`,
          },
        }}
      >
        <DataGrid
          rows={filteredEvents}
          columns={columns}
          slots={{ toolbar: GridToolbar }}
          autoHeight
          disableRowSelectionOnClick  // Disable row selection on row click to temporarily fix accept/reject button issue
          resizeThrottleMs={0}
        />
      </Box>
    </Box>
  );
};

export default PendingEventRequest;