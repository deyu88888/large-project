import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Button, Select, MenuItem, TextField } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { apiClient } from "../../api";
import { tokens } from "../../theme/theme.ts";
import { ReportFormData, SelectChangeEvent } from "../../types/president/report";

// Component for page header
const PageHeader: React.FC<{ textColor: string }> = ({ textColor }) => (
  <Typography 
    variant="h2" 
    fontWeight="bold" 
    mb={3}
    sx={{ color: textColor }}
  >
    Report to Admin
  </Typography>
);

// Component for field labels
const FieldLabel: React.FC<{ 
  label: string; 
  textColor: string; 
  marginTop?: number 
}> = ({ label, textColor, marginTop = 0 }) => (
  <Typography 
    variant="h6" 
    fontWeight="bold" 
    mt={marginTop} 
    mb={1}
    sx={{ color: textColor }}
  >
    {label}
  </Typography>
);

// Component for the report type dropdown
const ReportTypeSelect: React.FC<{
  value: string;
  onChange: (e: SelectChangeEvent) => void;
  selectBackgroundColor: string;
  reportTypes: Array<{ value: string; label: string }>;
}> = ({ value, onChange, selectBackgroundColor, reportTypes }) => (
  <Select
    name="report_type"
    value={value}
    onChange={onChange}
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
);

// Component for text input fields
const TextInputField: React.FC<{
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  label: string;
  multiline?: boolean;
  rows?: number;
  backgroundColor: string;
  textColor: string;
}> = ({ 
  name, 
  value, 
  onChange, 
  label, 
  multiline = false, 
  rows = 1, 
  backgroundColor, 
  textColor 
}) => (
  <TextField
    name={name}
    value={value}
    onChange={onChange}
    fullWidth
    required
    label={label}
    aria-label={label}
    multiline={multiline}
    rows={rows}
    sx={{
      backgroundColor,
      color: textColor,
      borderRadius: "4px",
    }}
  />
);

// Component for the submit button
const SubmitButton: React.FC<{
  buttonColor: string;
  hoverColor: string;
}> = ({ buttonColor, hoverColor }) => (
  <Button
    type="submit"
    fullWidth
    sx={{
      mt: 3,
      backgroundColor: buttonColor,
      color: "#ffffff",
      fontWeight: "bold",
      "&:hover": { backgroundColor: hoverColor },
    }}
  >
    Submit Report
  </Button>
);

// Main component
const ReportToAdmin: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<ReportFormData>({
    report_type: "Misconduct",
    subject: "",
    details: "",
  });

  const getReportTypes = (): Array<{ value: string; label: string }> => {
    return [
      { value: "Misconduct", label: "Misconduct" },
      { value: "System Issue", label: "System Issue" },
      { value: "Society Issue", label: "Society Issue" },
      { value: "Event Issue", label: "Event Issue" },
      { value: "Other", label: "Other" }
    ];
  };

  const getThemeColors = () => {
    return {
      backgroundColor: theme.palette.mode === "dark" ? "#141b2d" : "#fcfcfc",
      textColor: theme.palette.mode === "dark" ? colors.grey[100] : "#141b2d",
      formBackgroundColor: theme.palette.mode === "dark" ? colors.primary[500] : "#ffffff",
      inputBackgroundColor: theme.palette.mode === "dark" ? colors.primary[600] : "#ffffff",
      selectBackgroundColor: theme.palette.mode === "dark" ? colors.grey[300] : "#ffffff",
      buttonColor: colors.redAccent[500],
      buttonHoverColor: colors.redAccent[600]
    };
  };

  const themeColors = getThemeColors();
  const reportTypes = getReportTypes();

  const updateFormField = (name: string, value: string): void => {
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent
  ): void => {
    const { name, value } = e.target;
    updateFormField(name, String(value));
  };

  const showSuccessMessage = (): void => {
    alert("Report submitted successfully!");
  };

  const navigateBack = (): void => {
    navigate(-1);
  };

  const sendReportToAPI = async (reportData: ReportFormData): Promise<void> => {
    await apiClient.post("/api/reports/to-admin/", reportData);
  };

  const handleSubmitSuccess = async (): Promise<void> => {
    showSuccessMessage();
    navigateBack();
  };

  const logSubmitError = (error: unknown): void => {
    console.error("Error submitting report:", error);
  };

  const submitReport = async (reportData: ReportFormData): Promise<void> => {
    try {
      await sendReportToAPI(reportData);
      await handleSubmitSuccess();
    } catch (error) {
      logSubmitError(error);
    }
  };

  const preventDefaultFormBehavior = (e: React.FormEvent): void => {
    e.preventDefault();
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    preventDefaultFormBehavior(e);
    await submitReport(formData);
  };

  const createTypeSection = (): React.ReactElement => {
    return (
      <>
        <FieldLabel label="Type of Report" textColor={themeColors.textColor} />
        <ReportTypeSelect 
          value={formData.report_type}
          onChange={handleChange}
          selectBackgroundColor={themeColors.selectBackgroundColor}
          reportTypes={reportTypes}
        />
      </>
    );
  };

  const createSubjectSection = (): React.ReactElement => {
    return (
      <>
        <FieldLabel label="Subject" textColor={themeColors.textColor} marginTop={3} />
        <TextInputField
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          label="Subject"
          backgroundColor={themeColors.inputBackgroundColor}
          textColor={themeColors.textColor}
        />
      </>
    );
  };

  const createDetailsSection = (): React.ReactElement => {
    return (
      <>
        <FieldLabel label="Report Details" textColor={themeColors.textColor} marginTop={3} />
        <TextInputField
          name="details"
          value={formData.details}
          onChange={handleChange}
          label="Report Details"
          multiline={true}
          rows={5}
          backgroundColor={themeColors.inputBackgroundColor}
          textColor={themeColors.textColor}
        />
      </>
    );
  };

  const createFormContent = (): React.ReactElement => {
    return (
      <>
        {createTypeSection()}
        {createSubjectSection()}
        {createDetailsSection()}
        <SubmitButton 
          buttonColor={themeColors.buttonColor} 
          hoverColor={themeColors.buttonHoverColor} 
        />
      </>
    );
  };

  const createReportForm = (): React.ReactElement => {
    return (
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          maxWidth: "600px",
          width: "100%",
          backgroundColor: themeColors.formBackgroundColor,
          p: 4,
          borderRadius: "8px",
          boxShadow: 3,
        }}
      >
        {createFormContent()}
      </Box>
    );
  };

  return (
    <Box
      minHeight="100vh"
      p={4}
      display="flex"
      flexDirection="column"
      alignItems="center"
      sx={{
        backgroundColor: themeColors.backgroundColor,
        color: themeColors.textColor,
      }}
    >
      <PageHeader textColor={themeColors.textColor} />
      {createReportForm()}
    </Box>
  );
};

export default ReportToAdmin;