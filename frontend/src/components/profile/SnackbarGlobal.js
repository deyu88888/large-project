import { jsx as _jsx } from "react/jsx-runtime";
import { Snackbar, Alert } from "@mui/material";
export default function SnackbarGlobal({ open, message, severity, onClose, }) {
    return (_jsx(Snackbar, { open: open, autoHideDuration: 3000, onClose: onClose, anchorOrigin: { vertical: "top", horizontal: "center" }, children: _jsx(Alert, { onClose: onClose, severity: severity, sx: { width: "100%" }, children: message }) }));
}
