import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiClient } from "../../api"; // adjust import as needed
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
import { tokens } from "../../theme/theme"; // adjust path as needed

interface Award {
  id: number;
  rank: string;
  title: string;
  description: string;
  is_custom: boolean;
}

const GiveAwardPage = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { student_id } = useParams<{ student_id: string }>();
  const navigate = useNavigate();
  const [awards, setAwards] = useState<Award[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all available awards on component mount
  useEffect(() => {
    const fetchAwards = async () => {
      try {
        const response = await apiClient.get("/api/awards");
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

  // Handler to assign an award to the student
  const handleGiveAward = async (awardId: number) => {
    try {
      // POST to assign the award to the student
      const studentIdNumber = Number(student_id);
      await apiClient.post("/api/award-students", {
        student_id: studentIdNumber,
        award_id: awardId,
      });
      alert("Award assigned successfully!");
      // Navigate back or to another page as needed
      navigate(-1);
    } catch (err) {
      console.error("Error giving award", err);
      alert("Failed to assign award.");
    }
  };

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
          backgroundColor: theme.palette.mode === "dark" ? "#141b2d" : "#fcfcfc",
          color: theme.palette.mode === "dark" ? colors.grey[100] : "#141b2d",
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
        backgroundColor: theme.palette.mode === "dark" ? "#141b2d" : "#fcfcfc",
        color: theme.palette.mode === "dark" ? colors.grey[100] : "#141b2d",
      }}
    >
      <Box textAlign="center" mb={4}>
        <Typography
          variant="h2"
          fontWeight="bold"
          sx={{
            color: theme.palette.mode === "dark" ? colors.grey[100] : "#141b2d",
          }}
        >
          Select an Award
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: theme.palette.mode === "dark" ? colors.grey[300] : colors.grey[700],
          }}
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
          backgroundColor: theme.palette.mode === "dark" ? colors.primary[500] : "#ffffff",
          color: theme.palette.mode === "dark" ? colors.grey[100] : "#141b2d",
          borderRadius: "8px",
          boxShadow: 3,
        }}
      >
        {awards.length === 0 ? (
          <Typography
            sx={{
              color: theme.palette.mode === "dark" ? colors.grey[300] : colors.grey[700],
            }}
          >
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
                      sx={{
                        color: theme.palette.mode === "dark" ? colors.grey[100] : "#141b2d",
                      }}
                    >
                      {award.title} ({award.rank})
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.mode === "dark" ? colors.grey[300] : colors.grey[700],
                      }}
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