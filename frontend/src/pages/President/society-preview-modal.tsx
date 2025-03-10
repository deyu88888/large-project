
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from "@mui/material";

interface SocietyData {
  name: string;
  category: string;
  social_media_links: Record<string, string>;
  membership_requirements: string;
  upcoming_projects_or_plans: string;
  tags: string[];
  icon?: string | File | null;
}

interface SocietyPreviewModalProps {
  open: boolean;
  onClose: () => void;
  formData: SocietyData;
}

const SocietyPreviewModal: React.FC<SocietyPreviewModalProps> = ({ open, onClose, formData }) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Society Preview</DialogTitle>
      <DialogContent dividers>
        <Box mb={2}>
          <Typography variant="subtitle2">Name:</Typography>
          <Typography variant="body1">{formData.name}</Typography>
        </Box>
        <Box mb={2}>
          <Typography variant="subtitle2">Category:</Typography>
          <Typography variant="body1">{formData.category}</Typography>
        </Box>
        <Box mb={2}>
          <Typography variant="subtitle2">Membership Requirements:</Typography>
          <Typography variant="body1">{formData.membership_requirements}</Typography>
        </Box>
        <Box mb={2}>
          <Typography variant="subtitle2">Upcoming Projects or Plans:</Typography>
          <Typography variant="body1">{formData.upcoming_projects_or_plans}</Typography>
        </Box>
        <Box mb={2}>
          <Typography variant="subtitle2">Tags:</Typography>
          <Typography variant="body1">{formData.tags.join(", ")}</Typography>
        </Box>
        <Box mb={2}>
          <Typography variant="subtitle2">Social Media Links:</Typography>
          {Object.entries(formData.social_media_links).map(([platform, link]) => (
            <Typography key={platform} variant="body1">
              {platform}: {link}
            </Typography>
          ))}
        </Box>
        
        {formData.icon && typeof formData.icon === "string" && (
          <Box mb={2}>
            <Typography variant="subtitle2">Icon:</Typography>
            <img src={formData.icon} alt="Society icon" style={{ maxWidth: "100%", height: "auto" }} />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Close Preview
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SocietyPreviewModal;
