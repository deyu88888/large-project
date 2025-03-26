import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// components/AvatarCropperModal.tsx
import { Dialog, DialogTitle, DialogActions, DialogContent, Button, Box } from "@mui/material";
import Cropper from "react-easy-crop";
import { useState } from "react";
export default function AvatarCropperModal({ open, imageSrc, onClose, onConfirm }) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const handleCropComplete = (_croppedArea, croppedPixels) => {
        setCroppedAreaPixels(croppedPixels);
    };
    const handleConfirm = async () => {
        const response = await fetch(imageSrc);
        const blob = await response.blob();
        const file = new File([blob], "avatar.jpg", { type: blob.type });
        onConfirm(file, croppedAreaPixels);
        onClose();
    };
    return (_jsxs(Dialog, { open: open, onClose: onClose, fullWidth: true, maxWidth: "sm", children: [_jsx(DialogTitle, { children: "Crop your avatar" }), _jsx(DialogContent, { children: _jsx(Box, { position: "relative", width: "100%", height: "400px", children: _jsx(Cropper, { image: imageSrc, crop: crop, zoom: zoom, aspect: 1, onCropChange: setCrop, onZoomChange: setZoom, onCropComplete: handleCropComplete }) }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: onClose, children: "Cancel" }), _jsx(Button, { onClick: handleConfirm, variant: "contained", children: "Confirm" })] })] }));
}
