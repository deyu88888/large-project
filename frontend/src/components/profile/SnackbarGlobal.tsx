import { Snackbar, Alert } from "@mui/material";

interface SnackbarGlobalProps {
  open: boolean;
  message: string;
  severity: "success" | "error";
  onClose: () => void;
}

export default function SnackbarGlobal({
  open,
  message,
  severity,
  onClose,
}: SnackbarGlobalProps) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={3000}
      onClose={onClose}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
    >
      <Alert onClose={onClose} severity={severity} sx={{ width: "100%" }}>
        {message}
      </Alert>
    </Snackbar>
  );
}
