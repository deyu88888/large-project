import React from "react";
import { IconButton, TextField, Typography } from "@mui/material";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FaTimes } from "react-icons/fa";

export type ExtraModuleType = "description" | "image" | "file" | "subtitle";

export interface ExtraModule {
  id: string;
  type: ExtraModuleType;
  textValue?: string;
  fileValue?: File;
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

  // 对于 image 类型生成预览 URL
  const previewUrl =
    mod.type === "image" && mod.fileValue ? URL.createObjectURL(mod.fileValue) : null;

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {/* 拖拽把手 */}
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

      {mod.type === "description" && (
        <>
          <Typography variant="subtitle1" gutterBottom>
            Additional Description
          </Typography>
          <TextField
            fullWidth
            variant="outlined"
            value={mod.textValue || ""}
            onChange={(e) => onChangeText(mod.id, e.target.value)}
            placeholder="Enter additional description"
          />
        </>
      )}

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

      {mod.type === "image" && (
        <>
          <Typography variant="subtitle1" gutterBottom>
            Image Upload
          </Typography>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onChangeFile(mod.id, file);
              }
            }}
          />
          {previewUrl && (
            <div style={{ marginTop: 8 }}>
              <img
                src={previewUrl}
                alt="preview"
                style={{ maxWidth: "100%", maxHeight: 200 }}
              />
            </div>
          )}
        </>
      )}

      {mod.type === "file" && (
        <>
          <Typography variant="subtitle1" gutterBottom>
            File Upload
          </Typography>
          <input
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onChangeFile(mod.id, file);
              }
            }}
          />
          {mod.fileValue && (
            <div style={{ marginTop: 8 }}>
              <Typography variant="body2">
                {mod.fileValue.name}
              </Typography>
            </div>
          )}
        </>
      )}

      <IconButton
        onClick={() => onDelete(mod.id)}
        sx={{ position: "absolute", top: 8, right: 8 }}
        size="small"
      >
        <FaTimes />
      </IconButton>
    </div>
  );
}