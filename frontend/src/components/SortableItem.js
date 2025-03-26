import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef } from "react";
import { IconButton, TextField, Typography, Button } from "@mui/material";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FaTimes } from "react-icons/fa";
export function SortableItem({ mod, onChangeText, onChangeFile, onDelete }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
        id: mod.id
    });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        border: "1px solid #ccc",
        borderRadius: 8,
        padding: 16,
        marginBottom: 8,
        position: "relative"
    };
    const fileInputRef = useRef(null);
    const imageSrc = mod.type === "image"
        ? mod.fileValue instanceof File
            ? URL.createObjectURL(mod.fileValue)
            : typeof mod.fileValue === "string"
                ? mod.fileValue
                : mod.textValue
        : null;
    let fileName = null;
    if (mod.type === "file") {
        if (mod.fileValue instanceof File) {
            fileName = mod.fileValue.name;
        }
        else if (typeof mod.fileValue === "string") {
            fileName = mod.fileValue.split("/").pop() || "Existing File";
        }
        else if (mod.textValue) {
            fileName = mod.textValue.split("/").pop() || "Existing File";
        }
    }
    return (_jsxs("div", { ref: setNodeRef, style: style, ...attributes, children: [_jsx("div", { style: {
                    cursor: "grab",
                    padding: "4px 8px",
                    background: "#eee",
                    borderRadius: 4,
                    display: "inline-block",
                    marginBottom: 8
                }, ...listeners, children: "Drag" }), mod.type === "description" && (_jsxs(_Fragment, { children: [_jsx(Typography, { variant: "subtitle1", gutterBottom: true, children: "Additional Description" }), _jsx(TextField, { fullWidth: true, variant: "outlined", minRows: 5, multiline: true, value: mod.textValue || "", onChange: (e) => onChangeText(mod.id, e.target.value), placeholder: "Enter additional description", InputProps: {
                            sx: {
                                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                    borderColor: "black",
                                    borderWidth: "1px"
                                }
                            }
                        } })] })), mod.type === "subtitle" && (_jsxs(_Fragment, { children: [_jsx(Typography, { variant: "subtitle1", gutterBottom: true, children: "Subtitle" }), _jsx(TextField, { fullWidth: true, variant: "outlined", value: mod.textValue || "", onChange: (e) => onChangeText(mod.id, e.target.value), placeholder: "Enter subtitle" })] })), mod.type === "image" && (_jsxs(_Fragment, { children: [_jsx(Typography, { variant: "subtitle1", gutterBottom: true, children: "Image Upload" }), _jsx("input", { ref: fileInputRef, type: "file", accept: "image/*", style: { display: "none" }, onChange: (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                onChangeFile(mod.id, file);
                            }
                        } }), _jsx(Button, { variant: "outlined", onClick: () => fileInputRef.current?.click(), sx: { color: "black", border: "2px solid #ccc" }, children: "Choose an image" }), imageSrc && (_jsx("div", { style: { marginTop: 8 }, children: _jsx("img", { src: imageSrc, alt: "preview", style: { width: "100%", height: "auto" } }) }))] })), mod.type === "file" && (_jsxs(_Fragment, { children: [_jsx(Typography, { variant: "subtitle1", gutterBottom: true, children: "File Upload" }), _jsx("input", { ref: fileInputRef, type: "file", style: { display: "none" }, onChange: (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                onChangeFile(mod.id, file);
                            }
                        } }), _jsx(Button, { variant: "outlined", onClick: () => fileInputRef.current?.click(), sx: { color: "black", border: "2px solid #ccc" }, children: "Choose a file" }), fileName && (_jsx("div", { style: { marginTop: 8 }, children: _jsx(Typography, { variant: "body2", children: fileName }) }))] })), _jsx(IconButton, { onClick: () => onDelete(mod.id), sx: { position: "absolute", top: 8, right: 8 }, size: "small", children: _jsx(FaTimes, {}) })] }));
}
