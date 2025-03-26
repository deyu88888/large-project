// TODO: did not refactor, giving error message: 'Failed to assign award.'
// TODO: Tala will fix this page, and refactor it.

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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

// interface Award {
//   id: number;
//   rank: string;
//   title: string;
//   description: string;
//   is_custom: boolean;
// }

interface StudentIdParam {
  student_id: string;
  memberId: string;
}

const GiveAwardPage: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const params = useParams();
  const [awards, setAwards] = useState<Award[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const studentId = params.student_id || params.memberId;

  useEffect(() => {
    const fetchAwards = async (): Promise<void> => {
      try {
        const response = await apiClient.get("/api/awards/");
        setAwards(response.data);
      } catch (err) {
        console.error("Error fetching awards", err);
        setError("Failed to load awards.");
      } finally {
        setLoading(false);
      }
    };

    fetchAwards();
  }, []);

  const handleGiveAward = async (awardId: number): Promise<void> => {
    try {
      const studentIdNumber = Number(studentId);
      await apiClient.post("/api/awards/students/", {
        student_id: studentIdNumber,
        award_id: awardId,
      });
      alert("Award assigned successfully!");
      navigate(-1);
    } catch (err) {
      console.error("Error giving award", err);
      alert("Failed to assign award.");
    }
  };

  const backgroundColor = theme.palette.mode === "dark" ? "#141b2d" : "#fcfcfc";
  const textColor = theme.palette.mode === "dark" ? colors.grey[100] : "#141b2d";
  const subtitleColor = theme.palette.mode === "dark" ? colors.grey[300] : colors.grey[700];
  const paperBackgroundColor = theme.palette.mode === "dark" ? colors.primary[500] : "#ffffff";

  if (loading) {
    return (
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
  }

  if (error) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        sx={{
          backgroundColor,
          color: textColor,
        }}
      >
        <Typography color={colors.redAccent[500]}>{error}</Typography>
      </Box>
    );
  }

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
          Select an Award
        </Typography>
        <Typography
          variant="body1"
          sx={{ color: subtitleColor }}
        >
          Choose an award to give to the student.
        </Typography>
      </Box>

      <Paper
        elevation={3}
        sx={{
          maxWidth: "800px",
          mx: "auto",
          p: 4,
          backgroundColor: paperBackgroundColor,
          color: textColor,
          borderRadius: "8px",
          boxShadow: 3,
        }}
      >
        {awards.length === 0 ? (
          <Typography sx={{ color: subtitleColor }}>
            No awards available.
          </Typography>
        ) : (
          <List sx={{ width: "100%" }}>
            {awards.map((award, index) => (
              <React.Fragment key={award.id}>
                <ListItem
                  sx={{
                    py: 2,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box>
                    <Typography
                      fontWeight="medium"
                      sx={{ color: textColor }}
                    >
                      {award.title} ({award.rank})
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: subtitleColor }}
                    >
                      {award.description}
                    </Typography>
                  </Box>
                  <Button
                    onClick={() => handleGiveAward(award.id)}
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
                </ListItem>
                {index < awards.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>

      <Box mt={3} textAlign="center">
        <Button
          onClick={() => navigate(-1)}
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
    </Box>
  );
};

export default GiveAwardPage;