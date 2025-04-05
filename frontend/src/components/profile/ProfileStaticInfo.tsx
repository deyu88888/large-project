import {Paper, Typography, Box, Divider, colors} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { User } from "../../types/user/user";
import {tokens} from "../../theme/theme";

interface ProfileStaticInfoProps {
  profile: User;
  colors: ReturnType<typeof tokens>;
}

export default function ProfileStaticInfo({ profile, colors }: ProfileStaticInfoProps) {
  const theme = useTheme();

  return (
      <Box>
        <Divider
          sx={{
            my: 3,
            "&::before, &::after": { borderColor: colors.grey[500] },
            color: colors.grey[100],
          }}
        >
          <Typography variant="h5">User Status</Typography>
        </Divider>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-around",
            flexWrap: "wrap",
            mb: 4,
            gap: 2,
          }}
        >
          {/* Username */}
          <Paper
            elevation={2}
            sx={{
              p: 2,
              flex: "1 1 30%",
              textAlign: "center",
              backgroundColor: theme.palette.info.light,
            }}
          >
            <Typography variant="caption" sx={{ textTransform: "uppercase", color: theme.palette.text.secondary }}>
              Username
            </Typography>
            <Typography variant="body1" sx={{ mt: 1, fontWeight: "bold" }}>
              {profile.username}
            </Typography>
          </Paper>

          {/* Role */}
          <Paper
            elevation={2}
            sx={{
              p: 2,
              flex: "1 1 30%",
              textAlign: "center",
              backgroundColor: theme.palette.success.light,
            }}
          >
            <Typography variant="caption" sx={{ textTransform: "uppercase", color: theme.palette.text.secondary }}>
              Role
            </Typography>
            <Typography variant="body1" sx={{ mt: 1, fontWeight: "bold" }}>
              {profile.is_president ? "President" : profile.role}
            </Typography>
          </Paper>

          {/* Status */}
          <Paper
            elevation={2}
            sx={{
              p: 2,
              flex: "1 1 30%",
              textAlign: "center",
              backgroundColor: theme.palette.warning.light,
            }}
          >
            <Typography variant="caption" sx={{ textTransform: "uppercase", color: theme.palette.text.secondary }}>
              Status
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mt: 1 }}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  bgcolor: profile.is_active ? theme.palette.success.main : theme.palette.grey[400],
                  mr: 1,
                }}
              />
              <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                {profile.is_active ? "Verified" : "Not Verified"}
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Box>
  );
}