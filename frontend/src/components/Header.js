import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Typography, Box, useTheme } from "@mui/material";
import { tokens } from "../theme/theme";
const Header = ({ title, subtitle }) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    return (_jsxs(Box, { mb: "30px", children: [_jsx(Typography, { variant: "h2", color: colors.grey[100], fontWeight: "bold", sx: { m: "0 0 5px 0" }, children: title }), _jsx(Typography, { variant: "h5", color: colors.blueAccent[400], children: subtitle })] }));
};
export default Header;
