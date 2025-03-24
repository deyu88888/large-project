export interface SocietyPreviewData {
    name: string;
    category: string;
    social_media_links: Record<string, string>;
    membership_requirements: string;
    upcoming_projects_or_plans: string;
    tags: string[];
    icon?: string | File | null;
}

export interface SocietyPreviewModalProps {
    open: boolean;
    onClose: () => void;
    formData: SocietyPreviewData;
}

export interface PreviewSectionProps {
    title: string;
    content: React.ReactNode;
}