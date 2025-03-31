import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Params } from "react-router-dom";
import { apiClient } from "../../api";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Paper,
  List,
  ListItem,
  Divider,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../theme/theme";
import { Award } from "../../types/president/award";
import {
  AwardAssignmentPayload,
  ThemeColors
} from "../../types/president/GiveAwardPage";

const GiveAwardPage: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const params = useParams<Params>();
  const [awards, setAwards] = useState<Award[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const studentId = params.student_id || params.memberId;

  const getThemeColors = (): ThemeColors => {
    return {
      backgroundColor: theme.palette.mode === "dark" ? "#141b2d" : "#fcfcfc",
      textColor: theme.palette.mode === "dark" ? colors.grey[100] : "#141b2d",
      subtitleColor: theme.palette.mode === "dark" ? colors.grey[300] : colors.grey[700],
      paperBackgroundColor: theme.palette.mode === "dark" ? colors.primary[500] : "#ffffff"
    };
  };

  const themeColors = getThemeColors();

  const handleFetchError = (err: unknown) => {
    console.error("Error fetching awards", err);
    setError("Failed to load awards.");
  };

  const finishLoading = () => {
    setLoading(false);
  };

  const processAwardsResponse = (data: Award[]) => {
    setAwards(data);
  };

  const fetchAwardsData = async () => {
    try {
      const response = await apiClient.get("/api/awards");
      processAwardsResponse(response.data);
    } catch (err) {
      handleFetchError(err);
    } finally {
      finishLoading();
    }
  };

  useEffect(() => {
    fetchAwardsData();
  }, []);

  const navigateBack = () => {
    navigate(-1);
  };

  const showSuccessAlert = () => {
    alert("Award assigned successfully!");
  };

  const showErrorAlert = () => {
    alert("Failed to assign award.");
  };

  const createAwardPayload = (awardId: number): AwardAssignmentPayload => {
    const studentIdNumber = Number(studentId);
    return {
      student_id: studentIdNumber,
      award_id: awardId,
    };
  };

  const sendAwardAssignment = async (payload: AwardAssignmentPayload) => {
    await apiClient.post("/api/award-students", payload);
  };

  const handleGiveAward = async (awardId: number): Promise<void> => {
    try {
      const payload = createAwardPayload(awardId);
      await sendAwardAssignment(payload);
      showSuccessAlert();
      navigateBack();
    } catch (err) {
      console.error("Error giving award", err);
      showErrorAlert();
    }
  };

  const createLoadingView = () => (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      sx={{ backgroundColor: colors.primary[400] }}
    >
      <CircularProgress color="secondary" />
    </Box>
  );

  const createErrorView = () => (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      sx={{
        backgroundColor: themeColors.backgroundColor,
        color: themeColors.textColor,
      }}
    >
      <Typography color={colors.redAccent[500]}>{error}</Typography>
    </Box>
  );

  const createPageHeader = () => (
    <Box textAlign="center" mb={4}>
      <Typography
        variant="h2"
        fontWeight="bold"
        sx={{ color: themeColors.textColor }}
      >
        Select an Award
      </Typography>
      <Typography
        variant="body1"
        sx={{ color: themeColors.subtitleColor }}
      >
        Choose an award to give to the student.
      </Typography>
    </Box>
  );

  const createNoAwardsMessage = () => (
    <Typography sx={{ color: themeColors.subtitleColor }}>
      No awards available.
    </Typography>
  );

  const createAwardButton = (awardId: number) => (
    <Button
      onClick={() => handleGiveAward(awardId)}
      sx={{
        backgroundColor: colors.greenAccent[500],
        color: "#ffffff",
        px: 2,
        py: 1,
        borderRadius: "4px",
        fontWeight: "bold",
        "&:hover": { backgroundColor: colors.greenAccent[600] },
      }}
    >
      Give Award
    </Button>
  );

  const createAwardDetails = (award: Award) => (
    <Box>
      <Typography
        fontWeight="medium"
        sx={{ color: themeColors.textColor }}
      >
        {award.title} ({award.rank})
      </Typography>
      <Typography
        variant="body2"
        sx={{ color: themeColors.subtitleColor }}
      >
        {award.description}
      </Typography>
    </Box>
  );

  const createAwardListItem = (award: Award, index: number) => (
    <React.Fragment key={award.id}>
      <ListItem
        sx={{
          py: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {createAwardDetails(award)}
        {createAwardButton(award.id)}
      </ListItem>
      {renderDividerIfNeeded(index)}
    </React.Fragment>
  );

  const renderDividerIfNeeded = (index: number) => {
    if (index < awards.length - 1) {
      return <Divider />;
    }
    return null;
  };

  const createAwardsList = () => (
    <List sx={{ width: "100%" }}>
      {awards.map((award, index) => createAwardListItem(award, index))}
    </List>
  );

  const createAwardsContent = () => {
    if (awards.length === 0) {
      return createNoAwardsMessage();
    }
    return createAwardsList();
  };

  const createAwardsPaper = () => (
    <Paper
      elevation={3}
      sx={{
        maxWidth: "800px",
        mx: "auto",
        p: 4,
        backgroundColor: themeColors.paperBackgroundColor,
        color: themeColors.textColor,
        borderRadius: "8px",
        boxShadow: 3,
      }}
    >
      {createAwardsContent()}
    </Paper>
  );

  const createBackButton = () => (
    <Box mt={3} textAlign="center">
      <Button
        onClick={navigateBack}
        sx={{
          backgroundColor: colors.grey[500],
          color: "#ffffff",
          px: 2,
          py: 1,
          borderRadius: "4px",
          fontWeight: "bold",
          "&:hover": { backgroundColor: colors.grey[600] },
        }}
      >
        Back
      </Button>
    </Box>
  );

  const createMainContent = () => (
    <Box
      minHeight="100vh"
      p={4}
      sx={{
        backgroundColor: themeColors.backgroundColor,
        color: themeColors.textColor,
      }}
    >
      {createPageHeader()}
      {createAwardsPaper()}
      {createBackButton()}
    </Box>
  );

  if (loading) {
    return createLoadingView();
  }

  if (error) {
    return createErrorView();
  }

  return createMainContent();
};

export default GiveAwardPage;