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

const EditEventDetails: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { society_id, event_id } = useParams<{ society_id: string; event_id: string }>();

  const [eventDetail, setEventDetail] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [duration, setDuration] = useState<string>("");

  useEffect(() => {
    if (!event_id) return;
    const fetchEventDetail = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/api/event/${event_id}/manage`);
        const data: EventDetail = response.data;
        setEventDetail(data);

        
        setTitle(data.title);
        setDescription(data.description);
        setLocation(data.location);
        setDate(data.date);
        setStartTime(data.start_time);
        setDuration(data.duration);
      } catch (err: any) {
        console.error("Error fetching event details:", err);
        setError("Failed to load event details.");
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetail();
  }, [event_id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        title: title.trim() || eventDetail?.title,
        description: description.trim() || eventDetail?.description,
        location: location.trim() || eventDetail?.location,
        date: date || eventDetail?.date,
        start_time: startTime || eventDetail?.start_time,
        duration: duration || eventDetail?.duration,
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

  return (
    <Box
      minHeight="100vh"
      p={4}
      sx={{
        backgroundColor: theme.palette.mode === "dark" ? "#141b2d" : "#fcfcfc",
        color: theme.palette.mode === "dark" ? "#fff" : "#141b2d",
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
          backgroundColor: theme.palette.mode === "dark" ? "#1e293b" : "#ffffff",
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
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          margin="normal"
          multiline
          rows={4}
        />
        <TextField
          label="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          fullWidth
          margin="normal"
          InputLabelProps={{ shrink: true }}
          required
        />
        <TextField
          label="Start Time"
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          fullWidth
          margin="normal"
          InputLabelProps={{ shrink: true }}
          required
        />
        <TextField
          label="Duration"
          type="text"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
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
