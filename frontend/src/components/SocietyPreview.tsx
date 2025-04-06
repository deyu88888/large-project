import {
  Dialog,
  DialogContent,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SocietyDetailLayout from "./SocietyDetailLayout";

interface SocietyPreviewProps {
  open: boolean;
  onClose: () => void;
  society: any;
  loading: boolean;
  joined: number | boolean;
  onJoinSociety: (societyId: number) => void;
}

export function SocietyPreview({
  open,
  onClose,
  society,
  loading,
  joined,
  onJoinSociety,
}: SocietyPreviewProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      PaperProps={{
        sx: {
          height: "90vh",
          borderRadius: 2,
        },
      }}
    >
      <AppBar sx={{ position: "relative" }}>
        <Toolbar>
        <IconButton edge="start" color="inherit" onClick={onClose} aria-label="close">
            <CloseIcon />
          </IconButton>
          <Typography sx={{ ml: 2, flex: 1 }} variant="h6">
            Society Preview
          </Typography>
        </Toolbar>
      </AppBar>
      <DialogContent dividers sx={{ p: 0 }}>
        <SocietyDetailLayout
          society={society}
          loading={loading}
          joined={joined}
          onJoinSociety={onJoinSociety}
        />
      </DialogContent>
    </Dialog>
  );
}