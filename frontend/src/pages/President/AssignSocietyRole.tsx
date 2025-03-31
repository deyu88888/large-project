import React, { useState, useEffect } from "react";
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
import { RoleOption } from "../../types/president/role";

const ROLE_OPTIONS: RoleOption[] = [
  { key: "vice_president", label: "Vice President" },
  { key: "event_manager", label: "Event Manager" },
];

const AssignSocietyRole: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { memberId } = useParams<{ memberId: string }>();
  const { societyId } = useParams<{ societyId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const backgroundColor = theme.palette.mode === "dark" ? "#141b2d" : "#fcfcfc";
  const textColor = theme.palette.mode === "dark" ? colors.grey[100] : "#141b2d";
  const paperBackgroundColor = theme.palette.mode === "dark" ? colors.primary[500] : "#ffffff";
  const subtitleColor = theme.palette.mode === "dark" ? colors.grey[300] : colors.grey[700];

  useEffect(() => {
    validateParams();
  }, [societyId]);

  const validateParams = () => {
    if (!societyId) {
      setError("Society ID is missing. Please go back and try again.");
    }
  };

  const handleError = (err: unknown) => {
    const axiosError = err as { response?: { data?: { error?: string } } };
    const message = axiosError?.response?.data?.error || "Failed to assign role. Please try again.";
    setError(message);
  };

  const buildPayload = (roleKey: string): Record<string, number> => ({
    [roleKey]: Number(memberId),
  });

  const sendRoleAssignment = async (roleKey: string) => {
    const payload = buildPayload(roleKey);
    await apiClient.patch(`/api/society/${societyId}/roles/`, payload);
  };

  const handleRoleAssignment = async (roleKey: string) => {
    if (!societyId) {
      setError("Cannot assign role: Society ID is missing");
      return;
    }
    
    setLoading(true);
    try {
      await sendRoleAssignment(roleKey);
      showSuccessMessage(roleKey);
      navigateBack();
    } catch (err) {
      console.error("Error assigning role", err);
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const showSuccessMessage = (roleKey: string) => {
    alert(`Assigned ${roleKey.replace("_", " ")} role to student ${memberId}`);
  };

  const navigateBack = () => {
    navigate(-1);
  };

  const createHeaderText = () => (
    <Typography variant="h2" fontWeight="bold" sx={{ color: textColor }}>
      Assign Society Role
    </Typography>
  );

  const createSubtitleText = () => (
    <Typography variant="body1" sx={{ color: subtitleColor }}>
      Choose a role to assign to student with ID: {memberId}
    </Typography>
  );

  const createHeader = () => (
    <Box textAlign="center" mb={4}>
      {createHeaderText()}
      {createSubtitleText()}
    </Box>
  );

  const createErrorMessage = () => {
    if (!error) return null;
    
    return (
      <Box mb={3} textAlign="center">
        <Typography color={colors.redAccent[500]}>{error}</Typography>
      </Box>
    );
  };

  const createRoleButton = (role: RoleOption) => (
    <Button
      key={role.key}
      onClick={() => handleRoleAssignment(role.key)}
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
  );

  const createRoleButtonsList = () => (
    <Stack spacing={2}>
      {ROLE_OPTIONS.map((role) => createRoleButton(role))}
    </Stack>
  );

  const createRoleButtonsContainer = () => (
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
      {createRoleButtonsList()}
    </Paper>
  );

  const createBackButton = () => (
    <Box mt={3} textAlign="center">
      <Button
        onClick={navigateBack}
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
  );

  const createLoader = () => {
    if (!loading) return null;
    
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress color="secondary" />
      </Box>
    );
  };

  const createPageContainer = (children: React.ReactNode) => (
    <Box
      minHeight="100vh"
      p={4}
      sx={{
        backgroundColor,
        color: textColor,
      }}
    >
      {children}
    </Box>
  );

  return createPageContainer(
    <>
      {createHeader()}
      {createErrorMessage()}
      {createRoleButtonsContainer()}
      {createBackButton()}
      {createLoader()}
    </>
  );
};

export default AssignSocietyRole;