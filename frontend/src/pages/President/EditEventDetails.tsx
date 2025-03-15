import React, { useState, useEffect, FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  TextField,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { apiClient } from "../../api";

interface EventDetail {
  id: number;
  title: string;
  description: string;
  location: string;
  date: string;
  start_time: string;
  duration: string;
  status: string;
}

interface RouteParams {
  society_id: string;
  event_id: string;
}

interface FormData {
  title: string;
  description: string;
  location: string;
  date: string;
  start_time: string;
  duration: string;
}

const EditEventDetails: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { society_id, event_id } = useParams<RouteParams>();

  const [eventDetail, setEventDetail] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    location: "",
    date: "",
    start_time: "",
    duration: ""
  });

  const handleInputChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    setFormData({
      ...formData,
      [field]: e.target.value
    });
  };

  useEffect(() => {
    if (!event_id) return;
    
    const fetchEventDetail = async (): Promise<void> => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/api/event/${event_id}/manage`);
        const data: EventDetail = response.data;
        setEventDetail(data);

        setFormData({
          title: data.title,
          description: data.description,
          location: data.location,
          date: data.date,
          start_time: data.start_time,
          duration: data.duration
        });
      } catch (err: any) {
        console.error("Error fetching event details:", err);
        setError("Failed to load event details.");
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetail();
  }, [event_id]);

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        title: formData.title.trim() || eventDetail?.title,
        description: formData.description.trim() || eventDetail?.description,
        location: formData.location.trim() || eventDetail?.location,
        date: formData.date || eventDetail?.date,
        start_time: formData.start_time || eventDetail?.start_time,
        duration: formData.duration || eventDetail?.duration,
      };
      
      await apiClient.patch(`/api/event/${event_id}/manage`, payload);
      setSuccess("Event update requested. Await admin approval.");

      if (import.meta.env.MODE === "test") {
        navigate(-1);
      } else {
        setTimeout(() => {
          navigate(-1);
        }, 2000);
      }
    } catch (err: any) {
      console.error("Error submitting update request:", err.response?.data || err);
      setError("Failed to submit update request.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress color="secondary" />
      </Box>
    );
  }

  if (!eventDetail) {
    return (
      <Box textAlign="center" mt={4}>
        <Typography variant="h6">Event not found.</Typography>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </Box>
    );
  }

  const backgroundColorMain = theme.palette.mode === "dark" ? "#141b2d" : "#fcfcfc";
  const textColorMain = theme.palette.mode === "dark" ? "#fff" : "#141b2d";
  const backgroundColorForm = theme.palette.mode === "dark" ? "#1e293b" : "#ffffff";

  return (
    <Box
      minHeight="100vh"
      p={4}
      sx={{
        backgroundColor: backgroundColorMain,
        color: textColorMain,
      }}
    >
      <Box textAlign="center" mb={4}>
        <Typography variant="h3" fontWeight="bold">
          Edit Event Details
        </Typography>
        <Typography variant="subtitle1">
          Make changes to the event. Your changes will be sent for admin approval.
        </Typography>
      </Box>
      <Box
        component="form"
        onSubmit={handleSubmit}
        maxWidth="600px"
        mx="auto"
        p={3}
        sx={{
          backgroundColor: backgroundColorForm,
          borderRadius: "8px",
          boxShadow: 3,
        }}
      >
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}
        <TextField
          label="Title"
          value={formData.title}
          onChange={handleInputChange("title")}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Description"
          value={formData.description}
          onChange={handleInputChange("description")}
          fullWidth
          margin="normal"
          multiline
          rows={4}
        />
        <TextField
          label="Location"
          value={formData.location}
          onChange={handleInputChange("location")}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Date"
          type="date"
          value={formData.date}
          onChange={handleInputChange("date")}
          fullWidth
          margin="normal"
          InputLabelProps={{ shrink: true }}
          required
        />
        <TextField
          label="Start Time"
          type="time"
          value={formData.start_time}
          onChange={handleInputChange("start_time")}
          fullWidth
          margin="normal"
          InputLabelProps={{ shrink: true }}
          required
        />
        <TextField
          label="Duration"
          type="text"
          value={formData.duration}
          onChange={handleInputChange("duration")}
          fullWidth
          margin="normal"
          helperText="Enter duration (e.g., '01:00:00' for 1 hour)"
          required
        />
        <Box display="flex" justifyContent="space-between" mt={3}>
          <Button variant="contained" color="primary" type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Changes"}
          </Button>
          <Button variant="outlined" onClick={() => navigate(-1)} disabled={submitting}>
            Cancel
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default EditEventDetails;