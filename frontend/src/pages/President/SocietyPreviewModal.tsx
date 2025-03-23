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

import { 
  SocietyPreviewData, 
  SocietyPreviewModalProps, 
  PreviewSectionProps 
} from "../../types/president/societyPreviewModal";

// interface SocietyPreviewData {
//   name: string;
//   category: string;
//   social_media_links: Record<string, string>;
//   membership_requirements: string;
//   upcoming_projects_or_plans: string;
//   tags: string[];
//   icon?: string | File | null;
// }

// interface SocietyPreviewModalProps {
//   open: boolean;
//   onClose: () => void;
//   formData: SocietyPreviewData;
// }

// interface PreviewSectionProps {
//   title: string;
//   content: React.ReactNode;
// }

const PreviewSection: React.FC<PreviewSectionProps> = ({ title, content }) => (
  <Box mb={2}>
    <Typography variant="subtitle2">{title}:</Typography>
    {content}
  </Box>
);

const SocietyPreviewModal: React.FC<SocietyPreviewModalProps> = ({ open, onClose, formData }) => {
  const renderSocialMediaLinks = (): React.ReactNode => (
    <>
      {Object.entries(formData.social_media_links).map(([platform, link]) => (
        <Typography key={platform} variant="body1">
          {platform}: {link}
        </Typography>
      ))}
    </>
  );

  const renderIcon = (): React.ReactNode | null => {
    if (formData.icon && typeof formData.icon === "string") {
      return (
        <img 
          src={formData.icon} 
          alt="Society icon" 
          style={{ maxWidth: "100%", height: "auto" }} 
        />
      );
    }
    return null;
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Society Preview</DialogTitle>
      <DialogContent dividers>
        <PreviewSection 
          title="Name" 
          content={<Typography variant="body1">{formData.name}</Typography>} 
        />
        <PreviewSection 
          title="Category" 
          content={<Typography variant="body1">{formData.category}</Typography>} 
        />
        <PreviewSection 
          title="Membership Requirements" 
          content={<Typography variant="body1">{formData.membership_requirements}</Typography>} 
        />
        <PreviewSection 
          title="Upcoming Projects or Plans" 
          content={<Typography variant="body1">{formData.upcoming_projects_or_plans}</Typography>} 
        />
        <PreviewSection 
          title="Tags" 
          content={<Typography variant="body1">{formData.tags.join(", ")}</Typography>} 
        />
        <PreviewSection 
          title="Social Media Links" 
          content={renderSocialMediaLinks()} 
        />
        
        {formData.icon && typeof formData.icon === "string" && (
          <PreviewSection 
            title="Icon" 
            content={renderIcon()} 
          />
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