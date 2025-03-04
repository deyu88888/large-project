import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Button, Select, MenuItem, TextField } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { apiClient } from "../../api";
import { tokens } from "../../theme/theme.ts";

const ReportToAdmin: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    report_type: "Misconduct",
    subject: "",
    details: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | { value: unknown }>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post("/api/report-to-admin", formData);
      alert("Report submitted successfully!");
      navigate(-1);
    } catch (error) {
      console.error("Error submitting report:", error);
    }
  };

  return (
    <Box
      minHeight="100vh"
      p={4}
      display="flex"
      flexDirection="column"
      alignItems="center"
      sx={{
        backgroundColor: theme.palette.mode === "dark" ? "#141b2d" : "#ffffff",
        color: theme.palette.mode === "dark" ? colors.grey[100] : "#000",
      }}
    >
      <Typography variant="h2" fontWeight="bold" mb={3}>
        Report to Admin
      </Typography>

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          maxWidth: "600px",
          width: "100%",
          backgroundColor: theme.palette.mode === "dark" ? colors.primary[500] : "#ffffff",
          p: 4,
          borderRadius: "8px",
          boxShadow: 3,
        }}
      >
        {/* Report Type */}
        <Typography variant="h6" fontWeight="bold" mb={1}>
          Type of Report
        </Typography>
        <Select
          name="report_type"
          value={formData.report_type}
          onChange={handleChange}
          fullWidth
          sx={{
            backgroundColor: theme.palette.mode === "dark" ? colors.grey[300] : "#ffffff",
            color: "#000",
            borderRadius: "4px",
          }}
        >
          <MenuItem value="Misconduct">Misconduct</MenuItem>
          <MenuItem value="System Issue">System Issue</MenuItem>
          <MenuItem value="Society Issue">Society Issue</MenuItem>
          <MenuItem value="Event Issue">Event Issue</MenuItem>
          <MenuItem value="Other">Other</MenuItem>
        </Select>

        {/* Subject */}
        <Typography variant="h6" fontWeight="bold" mt={3} mb={1}>
          Subject
        </Typography>
        <TextField
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          fullWidth
          required
          sx={{
            backgroundColor: theme.palette.mode === "dark" ? colors.primary[600] : "#ffffff",
            color: theme.palette.mode === "dark" ? colors.grey[100] : "#000",
            borderRadius: "4px",
          }}
        />

        {/* Details */}
        <Typography variant="h6" fontWeight="bold" mt={3} mb={1}>
          Report Details
        </Typography>
        <TextField
          name="details"
          value={formData.details}
          onChange={handleChange}
          fullWidth
          multiline
          rows={5}
          required
          sx={{
            backgroundColor: theme.palette.mode === "dark" ? colors.primary[600] : "#ffffff",
            color: theme.palette.mode === "dark" ? colors.grey[100] : "#000",
            borderRadius: "4px",
          }}
        />

        {/* Submit Button */}
        <Button
          type="submit"
          fullWidth
          sx={{
            mt: 3,
            backgroundColor: colors.redAccent[500],
            color: "#ffffff",
            fontWeight: "bold",
            "&:hover": { backgroundColor: colors.redAccent[600] },
          }}
        >
          Submit Report
        </Button>
      </Box>
    </Box>
  );
};

export default ReportToAdmin;
