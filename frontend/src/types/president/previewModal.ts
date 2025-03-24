import { SocietyData } from "./society";

export interface SocietyPreviewModalProps {
  open: boolean;
  onClose: () => void;
  formData: SocietyData;
}

export interface PreviewSectionProps {
  title: string;
  content: React.ReactNode;
}