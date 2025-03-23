import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiClient } from "../../api";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Paper,
  Stack,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../theme/theme";
import{ RoleOption, RouteParams } from "../../types/president/role";

// interface RoleOption {
//   key: string;
//   label: string;
// }

// interface RouteParams {
//   society_id: string;
//   student_id: string;
// }

const ROLE_OPTIONS: RoleOption[] = [
  { key: "vice_president", label: "Vice President" },
  { key: "event_manager", label: "Event Manager" },
  { key: "treasurer", label: "Treasurer" },
];

const AssignSocietyRole: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { society_id, student_id } = useParams<RouteParams>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAssignRole = async (roleKey: string): Promise<void> => {
    try {
      setLoading(true);
      
      const payload: Record<string, number> = {
        [roleKey]: Number(student_id)
      };
      
      await apiClient.patch(`/api/manage-society-details/${society_id}`, payload);
      alert(`Assigned ${roleKey.replace("_", " ")} role to student ${student_id}`);
      navigate(-1);
    } catch (err: any) {
      console.error("Error assigning role", err.response?.data || err);
      setError("Failed to assign role. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const backgroundColor = theme.palette.mode === "dark" ? "#141b2d" : "#fcfcfc";
  const textColor = theme.palette.mode === "dark" ? colors.grey[100] : "#141b2d";
  const paperBackgroundColor = theme.palette.mode === "dark" ? colors.primary[500] : "#ffffff";
  const subtitleColor = theme.palette.mode === "dark" ? colors.grey[300] : colors.grey[700];

  return (
    <Box
      minHeight="100vh"
      p={4}
      sx={{
        backgroundColor,
        color: textColor,
      }}
    >
      <Box textAlign="center" mb={4}>
        <Typography
          variant="h2"
          fontWeight="bold"
          sx={{ color: textColor }}
        >
          Assign Society Role
        </Typography>
        <Typography
          variant="body1"
          sx={{ color: subtitleColor }}
        >
          Choose a role to assign to student with ID: {student_id}
        </Typography>
      </Box>

      {error && (
        <Box mb={3} textAlign="center">
          <Typography color={colors.redAccent[500]}>{error}</Typography>
        </Box>
      )}

      <Paper
        elevation={3}
        sx={{
          maxWidth: "500px",
          mx: "auto",
          p: 4,
          backgroundColor: paperBackgroundColor,
          color: textColor,
          borderRadius: "8px",
          boxShadow: 3,
        }}
      >
        <Stack spacing={2}>
          {ROLE_OPTIONS.map((role) => (
            <Button
              key={role.key}
              onClick={() => handleAssignRole(role.key)}
              disabled={loading}
              sx={{
                backgroundColor: colors.blueAccent[500],
                color: "#ffffff",
                py: 1.5,
                fontWeight: "bold",
                "&:hover": { backgroundColor: colors.blueAccent[600] },
                "&.Mui-disabled": {
                  backgroundColor: colors.blueAccent[300],
                  color: "#ffffff",
                },
              }}
            >
              {role.label}
            </Button>
          ))}
        </Stack>
      </Paper>

      <Box mt={3} textAlign="center">
        <Button
          onClick={() => navigate(-1)}
          disabled={loading}
          sx={{
            backgroundColor: colors.grey[500],
            color: "#ffffff",
            px: 3,
            py: 1,
            borderRadius: "4px",
            fontWeight: "bold",
            "&:hover": { backgroundColor: colors.grey[600] },
            "&.Mui-disabled": {
              backgroundColor: colors.grey[300],
              color: "#ffffff",
            },
          }}
        >
          Back
        </Button>
      </Box>

      {loading && (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress color="secondary" />
        </Box>
      )}
    </Box>
  );
};

export default AssignSocietyRole;