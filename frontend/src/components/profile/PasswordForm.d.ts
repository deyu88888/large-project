import { tokens } from "../../theme/theme";
interface SnackbarData {
    open: boolean;
    message: string;
    severity: "success" | "error";
}
interface PasswordFormProps {
    isDark: boolean;
    colors: ReturnType<typeof tokens>;
    setSnackbarData: (data: SnackbarData) => void;
}
export default function PasswordForm({ isDark, colors, setSnackbarData }: PasswordFormProps): import("react/jsx-runtime").JSX.Element;
export {};
