interface Props {
    open: boolean;
    imageSrc: string;
    onClose: () => void;
    onConfirm: (file: File, crop: {
        x: number;
        y: number;
        width: number;
        height: number;
    }) => void;
}
export default function AvatarCropperModal({ open, imageSrc, onClose, onConfirm }: Props): import("react/jsx-runtime").JSX.Element;
export {};
