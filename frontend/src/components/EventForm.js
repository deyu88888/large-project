import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { Box, Button, Menu, MenuItem, Snackbar, TextField, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { SortableItem } from "./SortableItem";
import { EventPreview } from "./EventPreview";
export const EventForm = ({ initialData, onSubmit, submitButtonText = "Submit Event", isEditMode = false, }) => {
    const [title, setTitle] = useState(initialData?.title || "");
    const [mainDescription, setMainDescription] = useState(initialData?.mainDescription || "");
    const [date, setDate] = useState(initialData?.date || "");
    const [startTime, setStartTime] = useState(initialData?.startTime || "");
    const [duration, setDuration] = useState(initialData?.duration || "01:00:00");
    const [location, setLocation] = useState(initialData?.location || "");
    const [maxCapacity, setMaxCapacity] = useState(initialData?.maxCapacity || 0);
    const [adminReason, setAdminReason] = useState(initialData?.adminReason || "");
    const [coverImageFile, setCoverImageFile] = useState(initialData?.coverImageFile || null);
    const [extraModules, setExtraModules] = useState(initialData?.extraModules || []);
    const [participantModules, setParticipantModules] = useState(initialData?.participantModules || []);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const [participantAnchorEl, setParticipantAnchorEl] = useState(null);
    const coverImageInputRef = useRef(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const eventDateTime = new Date(`${date}T${startTime}`);
    const now = new Date();
    const isPastEvent = eventDateTime < now;
    const formatStartTime = (timeStr) => {
        return timeStr.length === 5 ? timeStr + ":00" : timeStr; // 如果是 HH:MM，补 :00
    };
    const handleAddModuleClick = (event) => setAnchorEl(event.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);
    const handleAddParticipantModuleClick = (event) => setParticipantAnchorEl(event.currentTarget);
    const handleParticipantMenuClose = () => setParticipantAnchorEl(null);
    useEffect(() => {
        if (isPastEvent) {
            setSnackbarOpen(true);
        }
    }, [date, startTime, isPastEvent]);
    const handleSnackbarClose = () => {
        setSnackbarOpen(false);
    };
    const handleSelectModule = (type) => {
        const newModule = { id: Date.now().toString(), type };
        setExtraModules((prev) => [...prev, newModule]);
        handleMenuClose();
    };
    const handleSelectParticipantModule = (type) => {
        const newModule = { id: Date.now().toString() + "_p", type };
        setParticipantModules((prev) => [...prev, newModule]);
        handleParticipantMenuClose();
    };
    const handleChangeText = (modulesSetter) => (id, newValue) => {
        modulesSetter((prev) => prev.map((mod) => (mod.id === id ? { ...mod, textValue: newValue } : mod)));
    };
    const handleChangeFile = (modulesSetter) => (id, file) => {
        modulesSetter((prev) => prev.map((mod) => (mod.id === id ? { ...mod, fileValue: file } : mod)));
    };
    const handleDeleteModule = (modulesSetter) => (id) => {
        modulesSetter((prev) => prev.filter((mod) => mod.id !== id));
    };
    const handleDragEnd = (_modules, modulesSetter) => (event) => {
        const { active, over } = event;
        if (!over || active.id === over.id)
            return;
        modulesSetter((prev) => {
            const oldIndex = prev.findIndex((mod) => mod.id === active.id);
            const newIndex = prev.findIndex((mod) => mod.id === over.id);
            return arrayMove(prev, oldIndex, newIndex);
        });
    };
    const handlePreview = () => {
        if (!coverImageFile && !initialData?.coverImageUrl) {
            alert("Please upload a cover image first!");
            return;
        }
        const fixedExtraModules = extraModules.map((mod) => {
            if (mod.type === "file" && !mod.fileValue && mod.textValue) {
                return { ...mod, fileValue: mod.textValue }; // 直接用 URL 字符串
            }
            return mod;
        });
        const fixedParticipantModules = participantModules.map((mod) => {
            if (mod.type === "file" && !mod.fileValue && mod.textValue) {
                return { ...mod, fileValue: mod.textValue };
            }
            return mod;
        });
        setPreviewData({
            title,
            mainDescription,
            date,
            startTime,
            duration,
            location,
            maxCapacity,
            coverImageFile,
            coverImageUrl: initialData?.coverImageUrl,
            extraModules: fixedExtraModules,
            participantModules: fixedParticipantModules,
            adminReason,
        });
        setPreviewOpen(true);
    };
    const handleClosePreview = () => setPreviewOpen(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isPastEvent) {
            setSnackbarOpen(true);
            return;
        }
        const formData = new FormData();
        formData.append("title", title);
        formData.append("main_description", mainDescription);
        formData.append("date", date);
        formData.append("start_time", formatStartTime(startTime));
        formData.append("duration", duration);
        formData.append("location", location);
        formData.append("max_capacity", String(maxCapacity));
        formData.append("admin_reason", adminReason);
        if (coverImageFile) {
            formData.append("cover_image", coverImageFile);
        }
        const extraModulesData = extraModules.map((mod) => ({
            type: mod.type,
            textValue: mod.textValue || "",
        }));
        formData.append("extra_modules", JSON.stringify(extraModulesData));
        extraModules.forEach((mod, index) => {
            if ((mod.type === "image" || mod.type === "file") && mod.fileValue) {
                formData.append(`extra_module_file_${index}`, mod.fileValue);
            }
        });
        const participantModulesData = participantModules.map((mod) => ({
            type: mod.type,
            textValue: mod.textValue || "",
        }));
        formData.append("participant_modules", JSON.stringify(participantModulesData));
        participantModules.forEach((mod, index) => {
            if ((mod.type === "image" || mod.type === "file") && mod.fileValue) {
                formData.append(`participant_module_file_${index}`, mod.fileValue);
            }
        });
        await onSubmit(formData);
    };
    const coverImagePreviewSrc = coverImageFile
        ? URL.createObjectURL(coverImageFile)
        : initialData?.coverImageUrl || "";
    return (_jsxs(Box, { sx: { p: 4 }, children: [_jsx(Typography, { variant: "h4", gutterBottom: true, children: isEditMode ? "Edit Event" : "Create a New Event" }), _jsxs("form", { onSubmit: handleSubmit, children: [_jsxs(Box, { sx: {
                            border: "2px solid #ccc",
                            borderRadius: 1,
                            p: 1,
                            display: "inline-block",
                            mt: 1,
                        }, children: [_jsxs(Typography, { variant: "subtitle1", gutterBottom: true, children: ["Cover Image ", isEditMode ? "(Optional)" : "(Required)"] }), _jsx("input", { ref: coverImageInputRef, type: "file", accept: "image/*", style: { display: "none" }, onChange: (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        setCoverImageFile(file);
                                    }
                                }, required: !isEditMode }), _jsx(Button, { variant: "outlined", sx: { color: "black", border: "2px solid #ccc" }, onClick: () => coverImageInputRef.current?.click(), children: "Choose Cover Image" }), coverImagePreviewSrc && (_jsx(Box, { component: "img", src: coverImagePreviewSrc, alt: "Cover preview", sx: {
                                    width: "100%",
                                    height: "auto",
                                    objectFit: "cover",
                                    border: "1px solid #ccc",
                                    borderRadius: 1,
                                    mt: 1,
                                } }))] }), _jsxs(Box, { sx: { mb: 3 }, children: [_jsx(Typography, { variant: "subtitle1", gutterBottom: true, children: "Event Title" }), _jsx(TextField, { value: title, onChange: (e) => setTitle(e.target.value), required: true, variant: "outlined", fullWidth: true, sx: { mb: 2 }, InputProps: {
                                    sx: {
                                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                            borderColor: "black",
                                            borderWidth: "1px"
                                        }
                                    }
                                } }), _jsx(Typography, { variant: "subtitle1", gutterBottom: true, children: "Date" }), _jsx(TextField, { type: "date", value: date, onChange: (e) => setDate(e.target.value), required: true, variant: "outlined", fullWidth: true, sx: { mb: 2 }, InputProps: {
                                    sx: {
                                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                            borderColor: "black",
                                            borderWidth: "1px"
                                        }
                                    }
                                } }), _jsx(Typography, { variant: "subtitle1", gutterBottom: true, children: "Start Time" }), _jsx(TextField, { type: "time", value: startTime, onChange: (e) => setStartTime(e.target.value), required: true, variant: "outlined", fullWidth: true, sx: { mb: 2 }, InputProps: {
                                    sx: {
                                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                            borderColor: "black",
                                            borderWidth: "1px"
                                        }
                                    }
                                } }), _jsx(Typography, { variant: "subtitle1", gutterBottom: true, children: "Duration (HH:MM:SS)" }), _jsx(TextField, { value: duration, onChange: (e) => setDuration(e.target.value), required: true, variant: "outlined", fullWidth: true, sx: { mb: 2 }, InputProps: {
                                    sx: {
                                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                            borderColor: "black",
                                            borderWidth: "1px"
                                        }
                                    }
                                } }), _jsx(Typography, { variant: "subtitle1", gutterBottom: true, children: "Location" }), _jsx(TextField, { value: location, onChange: (e) => setLocation(e.target.value), required: true, variant: "outlined", fullWidth: true, sx: { mb: 2 }, InputProps: {
                                    sx: {
                                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                            borderColor: "black",
                                            borderWidth: "1px"
                                        }
                                    }
                                } }), _jsx(Typography, { variant: "subtitle1", gutterBottom: true, children: "Max Capacity (0 = No Limit)" }), _jsx(TextField, { type: "number", value: maxCapacity, onChange: (e) => setMaxCapacity(Number(e.target.value)), required: true, variant: "outlined", fullWidth: true, sx: { mb: 2 }, InputProps: {
                                    sx: {
                                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                            borderColor: "black",
                                            borderWidth: "1px"
                                        }
                                    }
                                } }), _jsx(Typography, { variant: "subtitle1", gutterBottom: true, children: "Main Description" }), _jsx(TextField, { value: mainDescription, onChange: (e) => setMainDescription(e.target.value), required: true, variant: "outlined", multiline: true, minRows: 5, fullWidth: true, sx: { mb: 2 }, InputProps: {
                                    sx: {
                                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                            borderColor: "black",
                                            borderWidth: "1px"
                                        }
                                    }
                                } })] }), _jsx(Typography, { variant: "h6", gutterBottom: true, children: "Extra Content (Optional)" }), _jsx(DndContext, { collisionDetection: closestCenter, onDragEnd: handleDragEnd(extraModules, setExtraModules), children: _jsx(SortableContext, { items: extraModules.map((m) => m.id), strategy: verticalListSortingStrategy, children: extraModules.map((mod) => (_jsx(SortableItem, { mod: mod, onChangeText: handleChangeText(setExtraModules), onChangeFile: handleChangeFile(setExtraModules), onDelete: handleDeleteModule(setExtraModules) }, mod.id))) }) }), _jsx(Box, { sx: { display: "flex", justifyContent: "center", my: 3 }, children: _jsx(Button, { variant: "outlined", onClick: handleAddModuleClick, startIcon: _jsx(AddIcon, {}), sx: { color: "black" }, children: "Add Extra Module" }) }), _jsxs(Menu, { anchorEl: anchorEl, open: Boolean(anchorEl), onClose: handleMenuClose, children: [_jsx(MenuItem, { onClick: () => handleSelectModule("subtitle"), children: "Subtitle" }), _jsx(MenuItem, { onClick: () => handleSelectModule("description"), children: "Additional Description" }), _jsx(MenuItem, { onClick: () => handleSelectModule("image"), children: "Image" }), _jsx(MenuItem, { onClick: () => handleSelectModule("file"), children: "File" })] }), _jsxs(Box, { sx: { my: 4, p: 2, border: "1px dashed #aaa", borderRadius: 2 }, children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Participants Only Content (Optional)" }), _jsx(DndContext, { collisionDetection: closestCenter, onDragEnd: handleDragEnd(participantModules, setParticipantModules), children: _jsx(SortableContext, { items: participantModules.map((m) => m.id), strategy: verticalListSortingStrategy, children: participantModules.map((mod) => (_jsx(SortableItem, { mod: mod, onChangeText: handleChangeText(setParticipantModules), onChangeFile: handleChangeFile(setParticipantModules), onDelete: handleDeleteModule(setParticipantModules) }, mod.id))) }) }), _jsx(Box, { sx: { display: "flex", justifyContent: "center", my: 2 }, children: _jsx(Button, { variant: "outlined", onClick: handleAddParticipantModuleClick, startIcon: _jsx(AddIcon, {}), sx: { color: "black" }, children: "Add Participant Module" }) }), _jsxs(Menu, { anchorEl: participantAnchorEl, open: Boolean(participantAnchorEl), onClose: handleParticipantMenuClose, children: [_jsx(MenuItem, { onClick: () => handleSelectParticipantModule("subtitle"), children: "Subtitle" }), _jsx(MenuItem, { onClick: () => handleSelectParticipantModule("description"), children: "Additional Description" }), _jsx(MenuItem, { onClick: () => handleSelectParticipantModule("image"), children: "Image" }), _jsx(MenuItem, { onClick: () => handleSelectParticipantModule("file"), children: "File" })] })] }), _jsxs(Box, { sx: { mb: 3, borderTop: "1px solid #ccc", pt: 2 }, children: [_jsx(Typography, { variant: "subtitle1", gutterBottom: true, children: "For Admin View Only" }), _jsx(TextField, { label: "Why do you want to create/edit this event?", value: adminReason, onChange: (e) => setAdminReason(e.target.value), multiline: true, rows: 3, fullWidth: true, required: true })] }), _jsx(Box, { sx: { display: "flex", justifyContent: "center", mb: 2 }, children: _jsx(Button, { variant: "outlined", onClick: handlePreview, color: "secondary", children: "Preview Event" }) }), _jsx(Box, { sx: { textAlign: "center" }, children: _jsx(Button, { type: "submit", variant: "contained", color: "primary", children: submitButtonText }) })] }), previewData && (_jsx(EventPreview, { open: previewOpen, onClose: handleClosePreview, eventData: {
                    ...previewData,
                    isParticipant: true,
                    isMember: true,
                    eventId: 0,
                    hostedBy: 0,
                } })), _jsx(Snackbar, { open: snackbarOpen, autoHideDuration: 3000, onClose: handleSnackbarClose, message: "You cannot submit a past event", anchorOrigin: { vertical: 'top', horizontal: 'center' }, ContentProps: {
                    sx: {
                        fontSize: "1rem",
                    }
                } })] }));
};
