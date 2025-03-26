import { User } from "../../types/user/user";
import { tokens } from "../../theme/theme";
interface SnackbarData {
    open: boolean;
    message: string;
    severity: "success" | "error";
}
interface ProfileFormProps {
    user: User;
    isDark: boolean;
    colors: ReturnType<typeof tokens>;
    sendOTP: (email: string) => Promise<void>;
    otpSent: boolean;
    otpMessage: string;
    setOtpSent: (v: boolean) => void;
    setOtpMessage: (v: string) => void;
    emailVerified: boolean;
    setEmailVerified: (v: boolean) => void;
    setSnackbarData: (data: SnackbarData) => void;
}
export default function ProfileForm({ user, isDark, colors, sendOTP, otpSent, otpMessage, setOtpSent, setOtpMessage, emailVerified, setEmailVerified, setSnackbarData, }: ProfileFormProps): import("react/jsx-runtime").JSX.Element;
export {};
