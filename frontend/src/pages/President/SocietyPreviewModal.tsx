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
  SocietyPreviewModalProps,
  PreviewSectionProps
} from "../../types/president/societyPreviewModal";

const PreviewSection: React.FC<PreviewSectionProps> = ({ title, content }) => (
  <Box mb={2}>
    <Typography variant="subtitle2">{title}:</Typography>
    {content}
  </Box>
);

const SocietyPreviewModal: React.FC<SocietyPreviewModalProps> = ({ open, onClose, formData }) => {
  const createSocialMediaItem = (platform: string, link: string): JSX.Element => {
    return (
      <Typography key={platform} variant="body1">
        {platform}: {link}
      </Typography>
    );
  };

  const createSocialMediaList = (): JSX.Element[] => {
    return Object.entries(formData.social_media_links).map(
      ([platform, link]) => createSocialMediaItem(platform, link)
    );
  };

  const renderSocialMediaLinks = (): React.ReactNode => {
    return <>{createSocialMediaList()}</>;
  };

  const isStringIcon = (): boolean => {
    return Boolean(formData.icon && typeof formData.icon === "string");
  };

  const createIconImage = (iconUrl: string): JSX.Element => {
    return (
      <img
        src={iconUrl}
        alt="Society icon"
        style={{ maxWidth: "100%", height: "auto" }}
      />
    );
  };

  const renderIcon = (): React.ReactNode | null => {
    if (isStringIcon()) {
      return createIconImage(formData.icon as string);
    }
    return null;
  };

  const createBasicSection = (title: string, content: string): JSX.Element => {
    return (
      <PreviewSection
        title={title}
        content={<Typography variant="body1">{content}</Typography>}
      />
    );
  };

  const createTagsSection = (): JSX.Element => {
    return (
      <PreviewSection
        title="Tags"
        content={<Typography variant="body1">{formData.tags.join(", ")}</Typography>}
      />
    );
  };

  const createSocialMediaSection = (): JSX.Element => {
    return (
      <PreviewSection
        title="Social Media Links"
        content={renderSocialMediaLinks()}
      />
    );
  };

  const createIconSection = (): JSX.Element | null => {
    if (!isStringIcon()) {
      return null;
    }
    
    return (
      <PreviewSection
        title="Icon"
        content={renderIcon()}
      />
    );
  };

  const createDialogTitle = (): JSX.Element => {
    return <DialogTitle>Society Preview</DialogTitle>;
  };

  const createNameSection = (): JSX.Element => {
    return createBasicSection("Name", formData.name);
  };

  const createCategorySection = (): JSX.Element => {
    return createBasicSection("Category", formData.category);
  };

  const createMembershipRequirementsSection = (): JSX.Element => {
    return createBasicSection("Membership Requirements", formData.membership_requirements);
  };

  const createUpcomingProjectsSection = (): JSX.Element => {
    return createBasicSection("Upcoming Projects or Plans", formData.upcoming_projects_or_plans);
  };

  const createDialogContent = (): JSX.Element => {
    return (
      <DialogContent dividers>
        {createNameSection()}
        {createCategorySection()}
        {createMembershipRequirementsSection()}
        {createUpcomingProjectsSection()}
        {createTagsSection()}
        {createSocialMediaSection()}
        {createIconSection()}
      </DialogContent>
    );
  };

  const createCloseButton = (): JSX.Element => {
    return (
      <Button onClick={onClose} variant="outlined">
        Close Preview
      </Button>
    );
  };

  const createDialogActions = (): JSX.Element => {
    return (
      <DialogActions>
        {createCloseButton()}
      </DialogActions>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      {createDialogTitle()}
      {createDialogContent()}
      {createDialogActions()}
    </Dialog>
  );
};

export default SocietyPreviewModal;