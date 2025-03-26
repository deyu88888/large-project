interface SocietyPreviewProps {
    open: boolean;
    onClose: () => void;
    society: any;
    loading: boolean;
    joined: number | boolean;
    onJoinSociety: (societyId: number) => void;
}
export declare function SocietyPreview({ open, onClose, society, loading, joined, onJoinSociety, }: SocietyPreviewProps): import("react/jsx-runtime").JSX.Element;
export {};
