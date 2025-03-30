import { Box, Divider, Paper, Typography } from "@mui/material";
import { FaTrophy } from "react-icons/fa";
import { tokens } from "../../theme/theme";

interface Award {
  id: number;
  award: {
    title: string;
    description: string;
    rank: "Gold" | "Silver" | "Bronze";
  };
}

interface AwardListProps {
  userId: number;
  awards: Award[];
  isSelf: boolean;
  colors: ReturnType<typeof tokens>;
}

export default function AwardList({ awards, isSelf, colors }: AwardListProps) {
  return (
    <>
      <Divider
        sx={{
          my: 3,
          "&::before, &::after": { borderColor: colors.grey[500] },
          color: colors.grey[100],
        }}
      >
        <Typography variant="h5">Awards & Achievements</Typography>
      </Divider>

      {awards.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography variant="body1" sx={{ color: colors.grey[300] }}>
            {isSelf
              ? "You haven't earned any awards yet"
              : "This user hasn't earned any awards yet"}
          </Typography>
        </Box>
      ) : (
        <Box
          display="flex"
          flexWrap="wrap"
          gap={3}
          justifyContent="flex-start"
        >
          {awards.map((award) => {
            const rankColor =
              award.award.rank === "Gold"
                ? "#FFD700"
                : award.award.rank === "Silver"
                ? "#C0C0C0"
                : "#CD7F32";

            const rankBg =
              award.award.rank === "Gold"
                ? "rgba(255, 215, 0, 0.1)"
                : award.award.rank === "Silver"
                ? "rgba(192, 192, 192, 0.1)"
                : "rgba(205, 127, 50, 0.1)";

            return (
              <Box
                key={award.id}
                sx={{
                  flex: "1 1 calc(33.333% - 24px)",
                  minWidth: "250px",
                }}
              >
                <Paper
                  elevation={3}
                  sx={{
                    p: 2,
                    height: "100%",
                    backgroundColor: colors.primary[500],
                    borderRadius: 2,
                    borderLeft: `4px solid ${rankColor}`,
                    transition: "transform 0.2s",
                    "&:hover": {
                      transform: "translateY(-5px)",
                    },
                  }}
                >
                  <Box display="flex" alignItems="center" mb={1}>
                    <FaTrophy
                      size={24}
                      style={{ marginRight: 12, color: rankColor }}
                    />
                    <Typography
                      variant="h6"
                      sx={{ color: colors.grey[100], fontWeight: "bold" }}
                    >
                      {award.award.title}
                    </Typography>
                  </Box>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      color: colors.grey[300],
                      mb: 1,
                      display: "inline-block",
                      backgroundColor: rankBg,
                      px: 1,
                      py: 0.5,
                      borderRadius: "4px",
                    }}
                  >
                    {award.award.rank} Award
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: colors.grey[300], mt: 1 }}
                  >
                    {award.award.description}
                  </Typography>
                </Paper>
              </Box>
            );
          })}
        </Box>
      )}
    </>
  );
}
