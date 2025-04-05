import { useEffect, useState } from "react";
import {Typography, Box, Paper, Divider} from "@mui/material";
import { tokens } from "../../theme/theme";
import { useTheme } from "@mui/material/styles";
import { apiClient } from "../../api";

interface ProfileUserProps {
  major?: string;
  isPresident?: boolean;
  isVicePresident?: boolean;
  isEventManager?: boolean;
  presidentOf?: number | null;
  vicePresidentOfSociety?: number | null;
  eventManagerOfSociety?: number | null;
}

export default function ProfileUserInfo({
  major,
  isPresident,
  isVicePresident,
  isEventManager,
  presidentOf,
  vicePresidentOfSociety,
  eventManagerOfSociety,
}: ProfileUserProps) {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [societyName, setSocietyName] = useState<string | null>(null);

  useEffect(() => {
    const societyId =
      presidentOf || vicePresidentOfSociety || eventManagerOfSociety;

    if (!societyId) return;

    apiClient
      .get(`/api/society/view/${societyId}/`)
      .then((res) => {
        setSocietyName(res.data.name);
      })
      .catch((err) => {
        console.error("Failed to fetch society info", err);
      });
  }, [presidentOf, vicePresidentOfSociety, eventManagerOfSociety]);

  const getPositionText = () => {
    if (!societyName) return null;
    if (isPresident) return `President of ${societyName}`;
    if (isVicePresident) return `Vice President of ${societyName}`;
    if (isEventManager) return `Event Manager of ${societyName}`;
    return null;
  };

  const positionText = getPositionText();

  if (!major && !positionText) return null;

  return (
    <Box mt={4}>
      <Divider
        sx={{
          my: 3,
          "&::before, &::after": { borderColor: colors.grey[500] },
          color: colors.grey[100],
        }}
      >
        <Typography variant="h5">User Information</Typography>
      </Divider>
      <Paper
        elevation={3}
        sx={{
          p: 3,
          backgroundColor: colors.primary[500],
          color: colors.grey[100],
          borderLeft: `4px solid ${colors.greenAccent[500]}`,
        }}
      >
        {major && (
          <Typography align="center" variant="body1" sx={{ mt: 1 }}>
            <strong>Major:</strong> {major}
          </Typography>
        )}

        {positionText && (
          <Typography align="center" variant="body1" sx={{ mt: 1 }}>
            <strong>Role:</strong> {positionText}
          </Typography>
        )}
      </Paper>
    </Box>
  );
}