import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Paper, Typography, Box, Divider } from "@mui/material";
import { useTheme } from "@mui/material/styles";
export default function ProfileStaticInfo({ profile, colors }) {
    const theme = useTheme();
    return (_jsxs(Box, { children: [_jsx(Divider, { sx: {
                    my: 3,
                    "&::before, &::after": { borderColor: colors.grey[500] },
                    color: colors.grey[100],
                }, children: _jsx(Typography, { variant: "h5", children: "User Status" }) }), _jsxs(Box, { sx: {
                    display: "flex",
                    justifyContent: "space-around",
                    flexWrap: "wrap",
                    mb: 4,
                    gap: 2,
                }, children: [_jsxs(Paper, { elevation: 2, sx: {
                            p: 2,
                            flex: "1 1 30%",
                            textAlign: "center",
                            backgroundColor: theme.palette.info.light,
                        }, children: [_jsx(Typography, { variant: "caption", sx: { textTransform: "uppercase", color: theme.palette.text.secondary }, children: "Username" }), _jsx(Typography, { variant: "body1", sx: { mt: 1, fontWeight: "bold" }, children: profile.username })] }), _jsxs(Paper, { elevation: 2, sx: {
                            p: 2,
                            flex: "1 1 30%",
                            textAlign: "center",
                            backgroundColor: theme.palette.success.light,
                        }, children: [_jsx(Typography, { variant: "caption", sx: { textTransform: "uppercase", color: theme.palette.text.secondary }, children: "Role" }), _jsx(Typography, { variant: "body1", sx: { mt: 1, fontWeight: "bold" }, children: profile.is_president ? "President" : profile.role })] }), _jsxs(Paper, { elevation: 2, sx: {
                            p: 2,
                            flex: "1 1 30%",
                            textAlign: "center",
                            backgroundColor: theme.palette.warning.light,
                        }, children: [_jsx(Typography, { variant: "caption", sx: { textTransform: "uppercase", color: theme.palette.text.secondary }, children: "Status" }), _jsxs(Box, { sx: { display: "flex", alignItems: "center", justifyContent: "center", mt: 1 }, children: [_jsx(Box, { sx: {
                                            width: 10,
                                            height: 10,
                                            borderRadius: "50%",
                                            bgcolor: profile.is_active ? theme.palette.success.main : theme.palette.grey[400],
                                            mr: 1,
                                        } }), _jsx(Typography, { variant: "body1", sx: { fontWeight: "bold" }, children: profile.is_active ? "Verified" : "Not Verified" })] })] })] })] }));
}
