import React, { useRef } from "react";
import { IconButton, TextField, Typography, Button } from "@mui/material";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FaTimes } from "react-icons/fa";

export type ExtraModuleType = "description" | "image" | "file" | "subtitle";

export interface ExtraModule {
  id: string;
  type: ExtraModuleType;
  textValue?: string;
  fileValue?: File | string;
}

interface SortableItemProps {
  mod: ExtraModule;
  onChangeText: (id: string, newValue: string) => void;
  onChangeFile: (id: string, file: File) => void;
  onDelete: (id: string) => void;
}

export function SortableItem({
  mod,
  onChangeText,
  onChangeFile,
  onDelete
}: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: mod.id
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    border: "1px solid #ccc",
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    position: "relative"
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  // If the module is "image", compute a preview src
  const imageSrc: string | null | undefined =
    mod.type === "image"
      ? mod.fileValue instanceof File
        ? URL.createObjectURL(mod.fileValue)
        : typeof mod.fileValue === "string"
        ? mod.fileValue
        : mod.textValue
      : null;

  // If the module is "file", extract a nice filename
  let fileName: string | null = null;
  if (mod.type === "file") {
    if (mod.fileValue instanceof File) {
      fileName = mod.fileValue.name;
    } else if (typeof mod.fileValue === "string") {
      fileName = mod.fileValue.split("/").pop() || "Existing File";
    } else if (mod.textValue) {
      fileName = mod.textValue.split("/").pop() || "Existing File";
    }
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {/* Drag handle */}
      <div
        style={{
          cursor: "grab",
          padding: "4px 8px",
          background: "#eee",
          borderRadius: 4,
          display: "inline-block",
          marginBottom: 8
        }}
        {...listeners}
      >
        Drag
      </div>

      {/* Description */}
      {mod.type === "description" && (
        <>
          <Typography variant="subtitle1" gutterBottom>
            Additional Description
          </Typography>
          <TextField
            fullWidth
            variant="outlined"
            minRows={5}
            multiline
            value={mod.textValue || ""}
            onChange={(e) => onChangeText(mod.id, e.target.value)}
            placeholder="Enter additional description"
            InputProps={{
              sx: {
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "black",
                  borderWidth: "1px"
                }
              }
            }}
          />
        </>
      )}

      {/* Subtitle */}
      {mod.type === "subtitle" && (
        <>
          <Typography variant="subtitle1" gutterBottom>
            Subtitle
          </Typography>
          <TextField
            fullWidth
            variant="outlined"
            value={mod.textValue || ""}
            onChange={(e) => onChangeText(mod.id, e.target.value)}
            placeholder="Enter subtitle"
          />
        </>
      )}

      {/* Image Upload */}
      {mod.type === "image" && (
        <>
          <Typography variant="subtitle1" gutterBottom>
            Image Upload
          </Typography>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onChangeFile(mod.id, file);
              }
            }}
          />
          <Button
            variant="outlined"
            onClick={() => fileInputRef.current?.click()}
            sx={{ color: "black", border: "2px solid #ccc" }}
          >
            Choose an image
          </Button>

          {imageSrc && (
            <div style={{ marginTop: 8 }}>
              <img
                src={imageSrc}
                alt="preview"
                style={{ width: "100%", height: "auto" }}
              />
            </div>
          )}
        </>
      )}

      {/* File Upload */}
      {mod.type === "file" && (
        <>
          <Typography variant="subtitle1" gutterBottom>
            File Upload
          </Typography>

          <input
            ref={fileInputRef}
            type="file"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onChangeFile(mod.id, file);
              }
            }}
          />
          <Button
            variant="outlined"
            onClick={() => fileInputRef.current?.click()}
            sx={{ color: "black", border: "2px solid #ccc" }}
          >
            Choose a file
          </Button>

          {fileName && (
            <div style={{ marginTop: 8 }}>
              <Typography variant="body2">
                {fileName}
              </Typography>
            </div>
          )}
        </>
      )}

      {/* Delete button with accessible label */}
      <IconButton
        aria-label="delete"
        onClick={() => onDelete(mod.id)}
        sx={{ position: "absolute", top: 8, right: 8 }}
        size="small"
      >
        <FaTimes />
      </IconButton>
    </div>
  );
}