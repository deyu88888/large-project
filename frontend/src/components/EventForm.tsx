import React, {useEffect, useRef, useState} from "react";
import {
  Box,
  Button,
  Menu,
  MenuItem, Snackbar,
  TextField,
  Typography
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { DndContext, DragEndEvent, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove
} from "@dnd-kit/sortable";
import { SortableItem, ExtraModule, ExtraModuleType } from "./SortableItem";
import { EventPreview } from "./EventPreview";

interface EventFormProps {
  initialData?: {
    title: string;
    mainDescription: string;
    date: string;
    startTime: string;
    duration: string;
    location: string;
    maxCapacity: number;
    coverImageFile?: File | null;
    coverImageUrl?: string;
    extraModules: ExtraModule[];
    participantModules: ExtraModule[];
    adminReason: string;
  };
  onSubmit: (formData: FormData) => Promise<void>;
  submitButtonText?: string;
  isEditMode?: boolean;
  onCancel?: VoidFunction;
}

export const EventForm: React.FC<EventFormProps> = ({
  initialData,
  onSubmit,
  submitButtonText = "Submit Event",
  isEditMode = false,
}) => {
  const [title, setTitle] = useState(initialData?.title || "");
  const [mainDescription, setMainDescription] = useState(initialData?.mainDescription || "");
  const [date, setDate] = useState(initialData?.date || "");
  const [startTime, setStartTime] = useState(initialData?.startTime || "");
  const [duration, setDuration] = useState(initialData?.duration || "01:00:00");
  const [location, setLocation] = useState(initialData?.location || "");
  const [maxCapacity, setMaxCapacity] = useState(initialData?.maxCapacity || 0);
  const [adminReason, setAdminReason] = useState(initialData?.adminReason || "");
  const [coverImageFile, setCoverImageFile] = useState<File | null>(initialData?.coverImageFile || null);
  const [extraModules, setExtraModules] = useState<ExtraModule[]>(initialData?.extraModules || []);
  const [participantModules, setParticipantModules] = useState<ExtraModule[]>(initialData?.participantModules || []);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<EventFormProps["initialData"] | null>(null);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [participantAnchorEl, setParticipantAnchorEl] = useState<null | HTMLElement>(null);

  const coverImageInputRef = useRef<HTMLInputElement>(null);

  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const eventDateTime = new Date(`${date}T${startTime}`);
  const now = new Date();
  const isPastEvent = eventDateTime < now;

  const formatStartTime = (timeStr: string): string => {
    return timeStr.length === 5 ? timeStr + ":00" : timeStr;  // 如果是 HH:MM，补 :00
  };

  const handleAddModuleClick = (event: React.MouseEvent<HTMLButtonElement>) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleAddParticipantModuleClick = (event: React.MouseEvent<HTMLButtonElement>) => setParticipantAnchorEl(event.currentTarget);
  const handleParticipantMenuClose = () => setParticipantAnchorEl(null);

  useEffect(() => {
    if (isPastEvent) {
      setSnackbarOpen(true);
    }
  }, [date, startTime, isPastEvent]);

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleSelectModule = (type: ExtraModuleType) => {
    const newModule: ExtraModule = { id: Date.now().toString(), type };
    setExtraModules((prev) => [...prev, newModule]);
    handleMenuClose();
  };

  const handleSelectParticipantModule = (type: ExtraModuleType) => {
    const newModule: ExtraModule = { id: Date.now().toString() + "_p", type };
    setParticipantModules((prev) => [...prev, newModule]);
    handleParticipantMenuClose();
  };

  const handleChangeText = (modulesSetter: React.Dispatch<React.SetStateAction<ExtraModule[]>>) =>
    (id: string, newValue: string) => {
      modulesSetter((prev) =>
        prev.map((mod) => (mod.id === id ? { ...mod, textValue: newValue } : mod))
      );
    };

  const handleChangeFile = (modulesSetter: React.Dispatch<React.SetStateAction<ExtraModule[]>>) =>
    (id: string, file: File) => {
      modulesSetter((prev) =>
        prev.map((mod) => (mod.id === id ? { ...mod, fileValue: file } : mod))
      );
    };

  const handleDeleteModule = (modulesSetter: React.Dispatch<React.SetStateAction<ExtraModule[]>>) =>
    (id: string) => {
      modulesSetter((prev) => prev.filter((mod) => mod.id !== id));
    };

  const handleDragEnd = (_modules: ExtraModule[], modulesSetter: React.Dispatch<React.SetStateAction<ExtraModule[]>>) =>
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
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
        return { ...mod, fileValue: mod.textValue };  // 直接用 URL 字符串
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

  const handleSubmit = async (e: React.FormEvent) => {
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

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        {isEditMode ? "Edit Event" : "Create a New Event"}
      </Typography>

      <form onSubmit={handleSubmit}>
        <Box
          sx={{
            border: "2px solid #ccc",
            borderRadius: 1,
            p: 1,
            display: "inline-block",
            mt: 1,
          }}
        >
          <Typography variant="subtitle1" gutterBottom>
            Cover Image {isEditMode ? "(Optional)" : "(Required)"}
          </Typography>

          <input
            ref={coverImageInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setCoverImageFile(file);
              }
            }}
            required={!isEditMode}
          />

          <Button
            variant="outlined"
            sx={{ color: "black", border: "2px solid #ccc" }}
            onClick={() => coverImageInputRef.current?.click()}
          >
            Choose Cover Image
          </Button>

          {coverImagePreviewSrc && (
            <Box
              component="img"
              src={coverImagePreviewSrc}
              alt="Cover preview"
              sx={{
                width: "100%",
                height: "auto",
                objectFit: "cover",
                border: "1px solid #ccc",
                borderRadius: 1,
                mt: 1,
              }}
            />
          )}
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>Event Title</Typography>
          <TextField
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            variant="outlined"
            fullWidth
            sx={{ mb: 2 }}
            InputProps={{
              sx: {
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "black",
                  borderWidth: "1px"
                }
              }
            }}
          />
          <Typography variant="subtitle1" gutterBottom>Date</Typography>
          <TextField
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            variant="outlined"
            fullWidth
            sx={{ mb: 2 }}
            InputProps={{
              sx: {
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "black",
                  borderWidth: "1px"
                }
              }
            }}
          />
          <Typography variant="subtitle1" gutterBottom>Start Time</Typography>
          <TextField
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
            variant="outlined"
            fullWidth
            sx={{ mb: 2 }}
            InputProps={{
              sx: {
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "black",
                  borderWidth: "1px"
                }
              }
            }}
          />
          <Typography variant="subtitle1" gutterBottom>Duration (HH:MM:SS)</Typography>
          <TextField
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            required
            variant="outlined"
            fullWidth
            sx={{ mb: 2 }}
            InputProps={{
              sx: {
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "black",
                  borderWidth: "1px"
                }
              }
            }}
          />
          <Typography variant="subtitle1" gutterBottom>Location</Typography>
          <TextField
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
            variant="outlined"
            fullWidth
            sx={{ mb: 2 }}
            InputProps={{
              sx: {
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "black",
                  borderWidth: "1px"
                }
              }
            }}
          />
          <Typography variant="subtitle1" gutterBottom>Max Capacity (0 = No Limit)</Typography>
          <TextField
            type="number"
            value={maxCapacity}
            onChange={(e) => setMaxCapacity(Number(e.target.value))}
            required
            variant="outlined"
            fullWidth
            sx={{ mb: 2 }}
            InputProps={{
              sx: {
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "black",
                  borderWidth: "1px"
                }
              }
            }}
          />
          <Typography variant="subtitle1" gutterBottom>Main Description</Typography>
          <TextField
            value={mainDescription}
            onChange={(e) => setMainDescription(e.target.value)}
            required
            variant="outlined"
            multiline
            minRows={5}
            fullWidth
            sx={{ mb: 2 }}
            InputProps={{
              sx: {
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "black",
                  borderWidth: "1px"
                }
              }
            }}
          />
        </Box>

        {/* Extra Modules */}
        <Typography variant="h6" gutterBottom>
          Extra Content (Optional)
        </Typography>
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd(extraModules, setExtraModules)}>
          <SortableContext items={extraModules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
            {extraModules.map((mod) => (
              <SortableItem
                key={mod.id}
                mod={mod}
                onChangeText={handleChangeText(setExtraModules)}
                onChangeFile={handleChangeFile(setExtraModules)}
                onDelete={handleDeleteModule(setExtraModules)}
              />
            ))}
          </SortableContext>
        </DndContext>
        <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
          <Button
            variant="outlined"
            onClick={handleAddModuleClick}
            startIcon={<AddIcon />}
            sx={{ color: "black" }}
          >
            Add Extra Module
          </Button>
        </Box>
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
          <MenuItem onClick={() => handleSelectModule("subtitle")}>Subtitle</MenuItem>
          <MenuItem onClick={() => handleSelectModule("description")}>Additional Description</MenuItem>
          <MenuItem onClick={() => handleSelectModule("image")}>Image</MenuItem>
          <MenuItem onClick={() => handleSelectModule("file")}>File</MenuItem>
        </Menu>

        {/* Participant Modules */}
        <Box sx={{ my: 4, p: 2, border: "1px dashed #aaa", borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Participants Only Content (Optional)
          </Typography>
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd(participantModules, setParticipantModules)}>
            <SortableContext items={participantModules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
              {participantModules.map((mod) => (
                <SortableItem
                  key={mod.id}
                  mod={mod}
                  onChangeText={handleChangeText(setParticipantModules)}
                  onChangeFile={handleChangeFile(setParticipantModules)}
                  onDelete={handleDeleteModule(setParticipantModules)}
                />
              ))}
            </SortableContext>
          </DndContext>
          <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
            <Button
              variant="outlined"
              onClick={handleAddParticipantModuleClick}
              startIcon={<AddIcon />}
              sx={{ color: "black" }}
            >
              Add Participant Module
            </Button>
          </Box>
          <Menu
            anchorEl={participantAnchorEl}
            open={Boolean(participantAnchorEl)}
            onClose={handleParticipantMenuClose}
          >
            <MenuItem onClick={() => handleSelectParticipantModule("subtitle")}>Subtitle</MenuItem>
            <MenuItem onClick={() => handleSelectParticipantModule("description")}>
              Additional Description
            </MenuItem>
            <MenuItem onClick={() => handleSelectParticipantModule("image")}>Image</MenuItem>
            <MenuItem onClick={() => handleSelectParticipantModule("file")}>File</MenuItem>
          </Menu>
        </Box>

        <Box sx={{ mb: 3, borderTop: "1px solid #ccc", pt: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            For Admin View Only
          </Typography>
          <TextField
            label="Why do you want to create/edit this event?"
            value={adminReason}
            onChange={(e) => setAdminReason(e.target.value)}
            multiline
            rows={3}
            fullWidth
            required
          />
        </Box>

        <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
          <Button variant="outlined" onClick={handlePreview} color="secondary">
            Preview Event
          </Button>
        </Box>

        <Box sx={{ textAlign: "center" }}>
          <Button type="submit" variant="contained" color="primary">
            {submitButtonText}
          </Button>
        </Box>
      </form>

      {previewData && (
        <EventPreview
          open={previewOpen}
          onClose={handleClosePreview}
          eventData={{
            ...previewData,
            is_participant: true,
            is_member: true,
            event_id: 0,
            hosted_by: 0,
          } as any}
        />
      )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        message="You cannot submit a past event"
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        ContentProps={{
          sx: {
            fontSize: "1rem",
          }
        }}
      />
    </Box>
  );
};

export type EventFormInitialData = EventFormProps["initialData"];
