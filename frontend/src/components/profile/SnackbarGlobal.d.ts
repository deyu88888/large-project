interface SnackbarGlobalProps {
    open: boolean;
    message: string;
    severity: "success" | "error";
    onClose: () => void;
}
export default function SnackbarGlobal({ open, message, severity, onClose, }: SnackbarGlobalProps): import("react/jsx-runtime").JSX.Element;
export {};
