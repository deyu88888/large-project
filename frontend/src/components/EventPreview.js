import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Dialog, DialogContent, AppBar, Toolbar, IconButton, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { EventDetailLayout } from "./EventDetailLayout";
export function EventPreview({ open, onClose, eventData }) {
    return (_jsxs(Dialog, { open: open, onClose: onClose, fullWidth: true, maxWidth: "lg", PaperProps: {
            sx: {
                height: "90vh",
                borderRadius: 2
            }
        }, children: [_jsx(AppBar, { sx: { position: "relative" }, children: _jsxs(Toolbar, { children: [_jsx(IconButton, { edge: "start", color: "inherit", onClick: onClose, children: _jsx(CloseIcon, {}) }), _jsx(Typography, { sx: { ml: 2, flex: 1 }, variant: "h6", children: "Event Preview" })] }) }), _jsx(DialogContent, { dividers: true, sx: { p: 0 }, children: _jsx(EventDetailLayout, { eventData: eventData }) })] }));
}
