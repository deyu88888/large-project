import React, { useState, useEffect, useContext } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { apiClient, apiPaths } from "../../api";
import { tokens } from "../../theme/theme";
import { SearchContext } from "../../components/layout/SearchContext";
import { useSettingsStore } from "../../stores/settings-store";

const AdminList: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [admins, setAdmins] = useState<any[]>([]);
  const { searchTerm } = useContext(SearchContext);
  const { drawer } = useSettingsStore();

  useEffect(() => {
    const getData = async () => {
      try {
        const res = await apiClient.get(apiPaths.USER.ADMIN);
        console.log(res.data);

        // Ensure we only store users with "admin" role
        const adminUsers = res.data.filter((user: any) => user.role === "admin");

        setAdmins(adminUsers);
      } catch (error) {
        console.error("Error fetching admins:", error);
      }
    };
    getData();
  }, []);

  // Filter admins based on search term (if provided)
  const filteredAdmins = admins.filter((admin) =>
    Object.values(admin)
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const columns = [
    { field: "id", headerName: "ID", flex: 1 },
    { field: "username", headerName: "Username", flex: 1 },
    { field: "first_name", headerName: "First Name", flex: 1 },
    { field: "last_name", headerName: "Last Name", flex: 1 },
    { field: "email", headerName: "Email", flex: 1 },
    {
      field: "is_active",
      headerName: "Active",
      renderCell: (params: any) => (params.row.is_active ? "Yes" : "No"),
      flex: 1,
    },
    { field: "role", headerName: "Role", flex: 1 },
    {
      field: "is_super_admin",
      headerName: "Super Admin",
      renderCell: (params: any) => (params.row.is_super_admin ? "Yes" : "No"),
      flex: 1,
    },
  ];

  return (
    <Box
      sx={{
        height: "calc(100vh - 64px)",
        maxWidth: drawer ? `calc(100% - 3px)` : "100%",
      }}
    >
      <Typography
        variant="h1"
        sx={{
          color: theme.palette.mode === "light" ? colors.grey[100] : colors.grey[100],
          fontSize: "1.75rem",
          fontWeight: 800,
          marginBottom: "1rem",
        }}
      >
        Admin List
      </Typography>

      <Box
        sx={{
          height: "78vh",
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
          rows={filteredAdmins} // Ensure it's a list of admin objects
          columns={columns}
          getRowId={(row) => row.id} // Ensure correct ID mapping
          slots={{ toolbar: GridToolbar }}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 25, page: 0 },
            },
          }}
          pageSizeOptions={[5, 10, 25]}
        />
      </Box>
    </Box>
  );
};

export default AdminList;
