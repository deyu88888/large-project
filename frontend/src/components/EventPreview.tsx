import {
  Dialog,
  DialogContent,
  AppBar,
  Toolbar,
  IconButton,
  Typography
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { EventDetailLayout, EventData } from "./EventDetailLayout";

interface Props {
  open: boolean;
  onClose: () => void;
  eventData: EventData;
}

export function EventPreview({ open, onClose, eventData }: Props) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      PaperProps={{
        sx: {
          height: "90vh",
          borderRadius: 2
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
