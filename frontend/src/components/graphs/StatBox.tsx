import { Box, Typography, useTheme } from "@mui/material";
import { tokens } from "../../theme/theme";
import ProgressCircle from "../graphs/ProgressCircle";

interface StatBoxProps {
  title?: string;
  subtitle: string;
  icon?: React.ReactNode;
  progress: number | string;
  increase?: string;
  gridColumn?: string;
  value?: any;
}

const StatBox: React.FC<StatBoxProps> = ({ title, subtitle, icon, progress, increase, gridColumn, value }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  return (
    <Box width="100%" m="0 30px" sx={{ gridColumn: gridColumn || "span 1" }}>
      <Box display="flex" justifyContent="space-between">
        <Box>
          {icon}
          <Typography variant="h4" fontWeight="bold" sx={{ color: colors.grey[100] }}>
            {title}
          </Typography>
          {value && (
            <Typography variant="h5" sx={{ color: colors.blueAccent[500] }}>
              {value}
            </Typography>
          )}
        </Box>
        <Box>
          <ProgressCircle progress={progress} />
        </Box>
      </Box>
      <Box display="flex" justifyContent="space-between" mt="2px">
        <Typography variant="h5" sx={{ color: colors.greenAccent[500] }}>
          {subtitle}
        </Typography>
        <Typography variant="h5" fontStyle="italic" sx={{ color: colors.greenAccent[600] }}>
          {increase}
        </Typography>
      </Box>
    </Box>
  );
};

export default StatBox;