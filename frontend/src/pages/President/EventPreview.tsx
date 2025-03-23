// EventPreview.tsx
import {
  Dialog,
  DialogContent,
  AppBar,
  Toolbar,
  IconButton,
  Typography
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { EventDetailLayout, EventData } from "../../components/EventDetailLayout";

interface Props {
  open: boolean;
  onClose: () => void;
  eventData: EventData;
}

export function EventPreviewFullScreen({ open, onClose, eventData }: Props) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      PaperProps={{
        sx: {
          // 让对话框高度可控
          height: "90vh",        // 占屏幕80%高度
          borderRadius: 2        // 边角圆润
        }
      }}
    >
      <AppBar sx={{ position: "relative" }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={onClose}>
            <CloseIcon />
          </IconButton>
          <Typography sx={{ ml: 2, flex: 1 }} variant="h6">
            Event Preview
          </Typography>
        </Toolbar>
      </AppBar>

      <DialogContent dividers sx={{ p: 0 }}>
        <EventDetailLayout eventData={eventData} />
      </DialogContent>
    </Dialog>
  );
}
