import { Dialog, DialogTitle, DialogActions, DialogContent, Button, Box } from "@mui/material";
import Cropper from "react-easy-crop";
import { useState } from "react";

interface Props {
  open: boolean;
  imageSrc: string;
  onClose: () => void;
  onConfirm: (file: File, crop: { x: number; y: number; width: number; height: number }) => void;
}

export default function AvatarCropperModal({ open, imageSrc, onClose, onConfirm }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const handleCropComplete = (_croppedArea: any, croppedPixels: any) => {
    setCroppedAreaPixels(croppedPixels);
  };

  const handleConfirm = async () => {
    const response = await fetch(imageSrc);
    const blob = await response.blob();
    const file = new File([blob], "avatar.jpg", { type: blob.type });

    onConfirm(file, croppedAreaPixels);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Crop your avatar</DialogTitle>
      <DialogContent>
        <Box position="relative" width="100%" height="400px">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleConfirm} variant="contained">Confirm</Button>
      </DialogActions>
    </Dialog>
  );
}
