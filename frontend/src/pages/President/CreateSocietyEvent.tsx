import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Button,
  Menu,
  MenuItem,
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

import { SortableItem, ExtraModule, ExtraModuleType } from "../../components/SortableItem";
import { EventPreviewFullScreen } from "./EventPreview";
import { apiClient } from "../../api";

export default function CreateEvent() {
  const { societyId } = useParams<{ societyId: string }>();
  const navigate = useNavigate();

  // 固定必填字段
  const [title, setTitle] = useState("");
  const [mainDescription, setMainDescription] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [duration, setDuration] = useState("01:00:00");
  const [location, setLocation] = useState("");
  const [maxCapacity, setMaxCapacity] = useState(0);
  const [adminReason, setAdminReason] = useState("");

  // 封面图片
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);

  // 公共额外模块区域（包含可选的副标题）
  const [extraModules, setExtraModules] = useState<ExtraModule[]>([]);
  // 参与者专享模块区域
  const [participantModules, setParticipantModules] = useState<ExtraModule[]>([]);

  // 控制添加模块菜单（公共区域）
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openMenu = Boolean(anchorEl);
  const handleAddModuleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  const handleSelectModule = (type: ExtraModuleType) => {
    const newModule: ExtraModule = { id: Date.now().toString(), type };
    setExtraModules((prev) => [...prev, newModule]);
    handleMenuClose();
  };

  // 公共区域模块修改
  const handleChangeText = (id: string, newValue: string) => {
    setExtraModules((prev) =>
      prev.map((mod) => (mod.id === id ? { ...mod, textValue: newValue } : mod))
    );
  };
  const handleChangeFile = (id: string, file: File) => {
    setExtraModules((prev) =>
      prev.map((mod) => (mod.id === id ? { ...mod, fileValue: file } : mod))
    );
  };
  const handleDeleteModule = (id: string) => {
    setExtraModules((prev) => prev.filter((mod) => mod.id !== id));
  };
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setExtraModules((prev) => {
      const oldIndex = prev.findIndex((mod) => mod.id === active.id);
      const newIndex = prev.findIndex((mod) => mod.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  // 参与者专享区域（与公共区域类似）
  const [participantAnchorEl, setParticipantAnchorEl] = useState<null | HTMLElement>(null);
  const openParticipantMenu = Boolean(participantAnchorEl);
  const handleAddParticipantModuleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setParticipantAnchorEl(event.currentTarget);
  };
  const handleParticipantMenuClose = () => {
    setParticipantAnchorEl(null);
  };
  const handleSelectParticipantModule = (type: ExtraModuleType) => {
    const newModule: ExtraModule = { id: Date.now().toString() + "_p", type };
    setParticipantModules((prev) => [...prev, newModule]);
    handleParticipantMenuClose();
  };
  const handleParticipantChangeText = (id: string, newValue: string) => {
    setParticipantModules((prev) =>
      prev.map((mod) => (mod.id === id ? { ...mod, textValue: newValue } : mod))
    );
  };
  const handleParticipantChangeFile = (id: string, file: File) => {
    setParticipantModules((prev) =>
      prev.map((mod) => (mod.id === id ? { ...mod, fileValue: file } : mod))
    );
  };
  const handleParticipantDeleteModule = (id: string) => {
    setParticipantModules((prev) => prev.filter((mod) => mod.id !== id));
  };
  const handleParticipantDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setParticipantModules((prev) => {
      const oldIndex = prev.findIndex((mod) => mod.id === active.id);
      const newIndex = prev.findIndex((mod) => mod.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  // 预览弹窗控制
  const [previewOpen, setPreviewOpen] = useState(false);
  const handlePreview = () => {
    if (!coverImageFile) {
      alert("Please upload a cover image first!");
      return;
    }
    setPreviewOpen(true);
  };
  const handleClosePreview = () => {
    setPreviewOpen(false);
  };

  // 提交事件
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!coverImageFile) {
      alert("Please upload a cover image before submitting!");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("main_description", mainDescription);
    formData.append("date", date);
    formData.append("start_time", startTime);
    formData.append("duration", duration);
    formData.append("location", location);
    formData.append("max_capacity", String(maxCapacity));
    formData.append("admin_reason", adminReason);
    formData.append("cover_image", coverImageFile);

    // 处理 extra_modules 的文字数据
    const extraModulesData = extraModules.map((mod) => ({
      type: mod.type,
      textValue: mod.textValue || "",
    }));
    formData.append("extra_modules", JSON.stringify(extraModulesData));

    // 附加 extra_modules 的文件数据（如果存在）
    extraModules.forEach((mod, index) => {
      if ((mod.type === "image" || mod.type === "file") && mod.fileValue) {
        formData.append(`extra_module_file_${index}`, mod.fileValue);
      }
    });

    // 同理，处理 participant_modules
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

    try {
      const response = await apiClient.post(`/api/society/${societyId}/create-society-event/`, formData);
      if (response.status === 201) {
        alert("Event created successfully!");
        navigate(-1);
      } else {
        throw new Error(`Server error: ${response.statusText}`);
      }
    } catch (error: any) {
      console.error("Error creating event:", error);
      alert("Failed to create event.");
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Create a New Event
      </Typography>

      <form onSubmit={handleSubmit}>
        {/* 封面图片必填 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Cover Image (Required)
          </Typography>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setCoverImageFile(file);
              }
            }}
            required
          />
          {coverImageFile && (
            <Box
              component="img"
              src={URL.createObjectURL(coverImageFile)}
              alt="Cover preview"
              sx={{
                width: 200,
                height: 120,
                objectFit: "cover",
                border: "1px solid #ccc",
                borderRadius: 1,
                mt: 1
              }}
            />
          )}
        </Box>

        {/* 固定字段 */}
        <Box sx={{ mb: 3 }}>
          <TextField
            label="Event Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            fullWidth
            sx={{ mb: 2 }}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Start Time"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
            fullWidth
            sx={{ mb: 2 }}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Duration (HH:MM:SS)"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            required
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Max Capacity (0 = No Limit)"
            type="number"
            value={maxCapacity}
            onChange={(e) => setMaxCapacity(Number(e.target.value))}
            required
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Main Description"
            value={mainDescription}
            onChange={(e) => setMainDescription(e.target.value)}
            required
            multiline
            rows={3}
            fullWidth
            sx={{ mb: 2 }}
          />
        </Box>

        {/* 公共额外模块区域 */}
        <Typography variant="h6" gutterBottom>
          Extra Content (Optional)
        </Typography>
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={extraModules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
            {extraModules.map((mod) => (
              <SortableItem
                key={mod.id}
                mod={mod}
                onChangeText={handleChangeText}
                onChangeFile={handleChangeFile}
                onDelete={handleDeleteModule}
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
        <Menu anchorEl={anchorEl} open={openMenu} onClose={handleMenuClose}>
          <MenuItem onClick={() => handleSelectModule("description")}>
            Additional Description
          </MenuItem>
          <MenuItem onClick={() => handleSelectModule("image")}>Image</MenuItem>
          <MenuItem onClick={() => handleSelectModule("file")}>File</MenuItem>
          <MenuItem onClick={() => handleSelectModule("subtitle")}>Subtitle</MenuItem>
        </Menu>

        {/* 参与者专享区域 */}
        <Box sx={{ my: 4, p: 2, border: "1px dashed #aaa", borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Participants Only Content (Optional)
          </Typography>
          <DndContext collisionDetection={closestCenter} onDragEnd={handleParticipantDragEnd}>
            <SortableContext items={participantModules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
              {participantModules.map((mod) => (
                <SortableItem
                  key={mod.id}
                  mod={mod}
                  onChangeText={handleParticipantChangeText}
                  onChangeFile={handleParticipantChangeFile}
                  onDelete={handleParticipantDeleteModule}
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
            open={openParticipantMenu}
            onClose={handleParticipantMenuClose}
          >
            <MenuItem onClick={() => handleSelectParticipantModule("description")}>
              Additional Description
            </MenuItem>
            <MenuItem onClick={() => handleSelectParticipantModule("image")}>Image</MenuItem>
            <MenuItem onClick={() => handleSelectParticipantModule("file")}>File</MenuItem>
            <MenuItem onClick={() => handleSelectParticipantModule("subtitle")}>Subtitle</MenuItem>
          </Menu>
        </Box>

        {/* Admin 理由 */}
        <Box sx={{ mb: 3, borderTop: "1px solid #ccc", pt: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            For Admin View Only
          </Typography>
          <TextField
            label="Why do you want to create this event?"
            value={adminReason}
            onChange={(e) => setAdminReason(e.target.value)}
            multiline
            rows={3}
            fullWidth
            required
          />
        </Box>

        {/* 预览按钮 */}
        <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
          <Button variant="outlined" onClick={handlePreview}>
            Preview Event
          </Button>
        </Box>

        {/* Submit 按钮 */}
        <Box sx={{ mt: 4, textAlign: "center" }}>
          <Button type="submit" variant="contained" color="primary">
            Submit Event
          </Button>
        </Box>
      </form>

      {/* 全屏预览弹窗 */}
      <EventPreviewFullScreen
        open={previewOpen}
        onClose={handleClosePreview}
        eventData={{
          title,
          mainDescription,
          date,
          startTime,
          duration,
          location,
          maxCapacity,
          coverImageFile,
          extraModules,
          participantModules
        }}
      />
    </Box>
  );
}
