import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Button, Select, MenuItem, TextField } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { apiClient } from "../../api";
import { tokens } from "../../theme/theme.ts";
import { ReportFormData, SelectChangeEvent } from "../../types/president/report.ts";

// interface ReportFormData {
//   report_type: string;
//   subject: string;
//   details: string;
// }

// type SelectChangeEvent = {
//   target: {
//     name: string;
//     value: unknown;
//   };
// };

const ReportToAdmin: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<ReportFormData>({
    report_type: "Misconduct",
    subject: "",
    details: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent
  ): void => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    try {
      await apiClient.post("/api/reports/to-admin/", formData);
      alert("Report submitted successfully!");
      navigate(-1);
    } catch (error) {
      console.error("Error submitting report:", error);
    }
  };

  const backgroundColor = theme.palette.mode === "dark" ? "#141b2d" : "#fcfcfc";
  const textColor = theme.palette.mode === "dark" ? colors.grey[100] : "#141b2d";
  const formBackgroundColor = theme.palette.mode === "dark" ? colors.primary[500] : "#ffffff";
  const inputBackgroundColor = theme.palette.mode === "dark" ? colors.primary[600] : "#ffffff";
  const selectBackgroundColor = theme.palette.mode === "dark" ? colors.grey[300] : "#ffffff";

  const reportTypes = [
    { value: "Misconduct", label: "Misconduct" },
    { value: "System Issue", label: "System Issue" },
    { value: "Society Issue", label: "Society Issue" },
    { value: "Event Issue", label: "Event Issue" },
    { value: "Other", label: "Other" }
  ];

  return (
    <Box
      minHeight="100vh"
      p={4}
      display="flex"
      flexDirection="column"
      alignItems="center"
      sx={{
        backgroundColor,
        color: textColor,
      }}
    >
      <Typography 
        variant="h2" 
        fontWeight="bold" 
        mb={3}
        sx={{ color: textColor }}
      >
        Report to Admin
      </Typography>

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          maxWidth: "600px",
          width: "100%",
          backgroundColor: formBackgroundColor,
          p: 4,
          borderRadius: "8px",
          boxShadow: 3,
        }}
      >
        <Typography 
          variant="h6" 
          fontWeight="bold" 
          mb={1}
          sx={{ color: textColor }}
        >
          Type of Report
        </Typography>
        <Select
          name="report_type"
          value={formData.report_type}
          onChange={handleChange}
          fullWidth
          aria-label="Type of Report"
          sx={{
            backgroundColor: selectBackgroundColor,
            color: "#000",
            borderRadius: "4px",
          }}
        >
          {reportTypes.map(type => (
            <MenuItem key={type.value} value={type.value}>
              {type.label}
            </MenuItem>
          ))}
        </Select>

        <Typography 
          variant="h6" 
          fontWeight="bold" 
          mt={3} 
          mb={1}
          sx={{ color: textColor }}
        >
          Subject
        </Typography>
        <TextField
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          fullWidth
          required
          label="Subject"
          aria-label="Subject"
          sx={{
            backgroundColor: inputBackgroundColor,
            color: textColor,
            borderRadius: "4px",
          }}
        />

        <Typography 
          variant="h6" 
          fontWeight="bold" 
          mt={3} 
          mb={1}
          sx={{ color: textColor }}
        >
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
          label="Report Details"
          aria-label="Report Details"
          sx={{
            backgroundColor: inputBackgroundColor,
            color: textColor,
            borderRadius: "4px",
          }}
        />

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