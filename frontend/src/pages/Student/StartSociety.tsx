import React, { useState } from "react";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../theme/theme";
import { apiClient } from "../../api";
import {
  StyleProps,
  FormData,
  FormState,
  HeaderProps,
  FormContainerProps,
  MessageProps,
  InputFieldProps,
  SubmitButtonProps,
  PageContainerProps
} from "../../types/student/StartSociety";

// Component Functions
const PageHeader: React.FC<HeaderProps> = ({ styleProps }) => {
  const { isLight, colours } = styleProps;
  
  return (
    <header style={{ textAlign: "center", marginBottom: "2.5rem" }}>
      <h1
        style={{
          fontSize: "2rem",
          fontWeight: "bold",
          color: isLight ? colours.grey[100] : colours.grey[100],
        }}
      >
        Start a Society
      </h1>
      <p
        style={{
          fontSize: "1.125rem",
          color: isLight ? colours.grey[300] : colours.grey[300],
          marginTop: "0.5rem",
        }}
      >
        Fill out the form below to submit your request for creating a new society.
      </p>
    </header>
  );
};

const FormContainer: React.FC<FormContainerProps> = ({ children, styleProps, onSubmit }) => {
  const { isLight } = styleProps;
  
  return (
    <form
      onSubmit={onSubmit}
      style={{
        maxWidth: "640px",
        margin: "0 auto",
        backgroundColor: isLight ? "#fcfcfc" : "#141b2d",
        padding: "2rem",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
      }}
    >
      {children}
    </form>
  );
};

const StatusMessages: React.FC<MessageProps> = ({ error, success, styleProps }) => {
  const { colours } = styleProps;
  
  return (
    <>
      {error && (
        <p style={{ color: colours.redAccent[500], marginBottom: "1rem" }}>
          {error}
        </p>
      )}
      {success && (
        <p style={{ color: colours.greenAccent[500], marginBottom: "1rem" }}>
          {success}
        </p>
      )}
    </>
  );
};

const InputField: React.FC<InputFieldProps> = ({ 
  id, 
  label, 
  value, 
  onChange, 
  multiline = false, 
  rows = 1, 
  styleProps 
}) => {
  const { isLight, colours } = styleProps;
  
  const commonStyles = {
    width: "100%",
    padding: "0.5rem 1rem",
    border: `1px solid ${colours.grey[300]}`,
    borderRadius: "4px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    outline: "none",
    fontSize: "1rem",
    color: isLight ? "#000" : "#fff",
    backgroundColor: isLight ? "#fcfcfc" : "#141b2d",
  };
  
  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <label
        htmlFor={id}
        style={{
          display: "block",
          color: isLight ? "#000" : "#fff",
          fontWeight: 500,
          marginBottom: "0.5rem",
        }}
      >
        {label}
      </label>
      {multiline ? (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          style={commonStyles}
        />
      ) : (
        <input
          type="text"
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={commonStyles}
        />
      )}
    </div>
  );
};

const SubmitButton: React.FC<SubmitButtonProps> = ({ styleProps }) => {
  const { colours } = styleProps;
  
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <button
        type="submit"
        style={{
          backgroundColor: colours.blueAccent[500],
          color: "#fff",
          padding: "0.5rem 1.5rem",
          borderRadius: "4px",
          border: "none",
          cursor: "pointer",
          transition: "background-color 0.3s",
        }}
      >
        Submit Request
      </button>
    </div>
  );
};

const PageContainer: React.FC<PageContainerProps> = ({ children, styleProps }) => {
  const { isLight, colours } = styleProps;
  
  return (
    <div
      style={{
        marginLeft: "0px",
        marginTop: "0px",
        transition: "margin-left 0.3s ease-in-out",
        minHeight: "100vh",
        padding: "3rem 2rem",
        backgroundColor: isLight ? colours.primary[1000] : colours.primary[500],
      }}
    >
      {children}
    </div>
  );
};

// Custom Hooks
const useFormFields = (): [FormData, (field: keyof FormData, value: string) => void, () => void] => {
  const [formData, setFormData] = useState<FormData>({
    societyName: "",
    description: "",
  });
  
  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const resetForm = () => {
    setFormData({
      societyName: "",
      description: "",
    });
  };
  
  return [formData, updateField, resetForm];
};

const useFormState = (): [FormState, (updates: Partial<FormState>) => void] => {
  const [formState, setFormState] = useState<FormState>({
    error: "",
    success: "",
  });
  
  const updateFormState = (updates: Partial<FormState>) => {
    setFormState(prev => ({
      ...prev,
      ...updates
    }));
  };
  
  return [formState, updateFormState];
};

// Main Component
const StartSociety: React.FC = () => {
  const theme = useTheme();
  const colours = tokens(theme.palette.mode);
  const isLight = theme.palette.mode === "light";
  const styleProps = { isLight, colours };
  
  const [formData, updateField, resetForm] = useFormFields();
  const [formState, updateFormState] = useFormState();

  const validateForm = (): boolean => {
    if (!formData.societyName || !formData.description) {
      updateFormState({ error: "Please fill out all fields.", success: "" });
      return false;
    }
    return true;
  };

  const submitSocietyRequest = async () => {
    try {
      updateFormState({ error: "", success: "" });
      
      const response = await apiClient.post("/api/start-society/", {
        name: formData.societyName,
        description: formData.description,
      });
      
      if (response.status === 201) {
        updateFormState({ success: "Society creation request submitted successfully!" });
        resetForm();
      } else {
        updateFormState({ error: "Something went wrong. Please try again." });
      }
    } catch (err) {
      console.error("Error creating society:", err);
      updateFormState({ error: "Failed to create society. Please try again later." });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      await submitSocietyRequest();
    }
  };

  return (
    <PageContainer styleProps={styleProps}>
      <PageHeader styleProps={styleProps} />
      
      <FormContainer styleProps={styleProps} onSubmit={handleSubmit}>
        <StatusMessages 
          error={formState.error} 
          success={formState.success} 
          styleProps={styleProps} 
        />
        
        <InputField
          id="societyName"
          label="Society Name"
          value={formData.societyName}
          onChange={(value) => updateField("societyName", value)}
          styleProps={styleProps}
        />
        
        <InputField
          id="description"
          label="Description"
          value={formData.description}
          onChange={(value) => updateField("description", value)}
          multiline={true}
          rows={5}
          styleProps={styleProps}
        />
        
        <SubmitButton styleProps={styleProps} />
      </FormContainer>
    </PageContainer>
  );
};

export default StartSociety;