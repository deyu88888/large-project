interface SnackbarData {
    open: boolean;
    message: string;
    severity: "success" | "error";
}
interface ProfileHeaderProps {
    isSelf: boolean;
    profile: {
        id: number;
        first_name: string;
        following_count?: number;
        followers_count?: number;
        icon?: string;
    };
    isFollowing: boolean;
    onToggleFollow: () => void;
    onAvatarUpdated?: (newUrl: string) => void;
    setSnackbarData: (data: SnackbarData) => void;
}
export default function ProfileHeader({ isSelf, profile, isFollowing, onToggleFollow, onAvatarUpdated, setSnackbarData }: ProfileHeaderProps): import("react/jsx-runtime").JSX.Element;
export {};
