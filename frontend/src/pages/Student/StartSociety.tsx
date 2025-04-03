import React, { useState, useEffect } from "react";
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
  PageContainerProps,
  ModalProps,
  UserStatusResponse
} from "../../types/student/StartSociety";
import { useAuthStore } from "../../stores/auth-store";

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

// Rejection Notice Component
const RejectionNotice = ({ 
  rejectedRequestName, 
  rejectionReason, 
  styleProps,
  onDismiss
}) => {
  const { isLight, colours } = styleProps;
  
  return (
    <div style={{ 
      backgroundColor: isLight ? colours.redAccent[100] : colours.redAccent[900], 
      padding: "1.25rem", 
      borderRadius: "8px", 
      marginBottom: "1.5rem",
      color: isLight ? colours.grey[900] : "#fff",
      border: `1px solid ${isLight ? colours.redAccent[300] : colours.redAccent[700]}`,
      position: "relative"
    }}>
      <button 
        onClick={onDismiss}
        style={{
          position: "absolute",
          top: "0.75rem",
          right: "0.75rem",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontSize: "1rem",
          color: isLight ? colours.grey[500] : colours.grey[300],
        }}
      >
        ✕
      </button>
      <h3 style={{ 
        color: isLight ? colours.redAccent[700] : colours.grey[100],
        marginTop: 0,
        marginBottom: "0.75rem",
        fontSize: "1.25rem"
      }}>
        Your Society Request Was Rejected
      </h3>
      <p style={{ marginBottom: "0.75rem", fontWeight: 500 }}>
        Your request for "{rejectedRequestName}" was not approved.
      </p>
      <div style={{ 
        backgroundColor: isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.1)",
        padding: "0.75rem",
        borderRadius: "4px",
        marginBottom: "0.75rem"
      }}>
        <p style={{ 
          fontWeight: 500, 
          marginBottom: "0.5rem",
          color: isLight ? colours.grey[800] : colours.grey[100]
        }}>
          Reason for rejection:
        </p>
        <p style={{ margin: 0 }}>{rejectionReason}</p>
      </div>
      <p style={{ margin: 0 }}>
        You can submit a new request addressing the issues mentioned above.
      </p>
    </div>
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

const SelectField: React.FC<any> = ({ 
  id, 
  label, 
  value, 
  onChange, 
  options = [],
  styleProps 
}) => {
  const { isLight, colours } = styleProps;
  
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
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "0.5rem 1rem",
          border: `1px solid ${colours.grey[300]}`,
          borderRadius: "4px",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          outline: "none",
          fontSize: "1rem",
          color: isLight ? "#000" : "#fff",
          backgroundColor: isLight ? "#fcfcfc" : "#141b2d",
        }}
      >
        <option value="">Select a category</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

const SubmitButton: React.FC<SubmitButtonProps> = ({ styleProps, disabled = false }) => {
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
        disabled={disabled}
        style={{
          backgroundColor: disabled ? colours.grey[400] : colours.blueAccent[500],
          color: "#fff",
          padding: "0.5rem 1.5rem",
          borderRadius: "4px",
          border: "none",
          cursor: disabled ? "not-allowed" : "pointer",
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

// Modal Component for Pending Request Notification
const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, message, styleProps }) => {
  const { isLight, colours } = styleProps;
  
  if (!isOpen) return null;
  
  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: isLight ? "#fff" : "#1F2A40",
        borderRadius: "8px",
        padding: "2rem",
        maxWidth: "500px",
        width: "90%",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
        animation: "fadeIn 0.3s",
      }}>
        <h2 style={{
          color: isLight ? colours.grey[100] : colours.grey[100],
          marginTop: 0,
          marginBottom: "1rem",
          fontSize: "1.5rem",
          textAlign: "center",
        }}>
          {title}
        </h2>
        
        <p style={{
          color: isLight ? colours.grey[200] : colours.grey[200],
          fontSize: "1rem",
          lineHeight: 1.5,
          marginBottom: "2rem",
          textAlign: "center",
        }}>
          {message}
        </p>
        
        <div style={{
          display: "flex",
          justifyContent: "center",
        }}>
          <button
            onClick={onClose}
            style={{
              backgroundColor: colours.blueAccent[500],
              color: "#fff",
              padding: "0.5rem 1.5rem",
              borderRadius: "4px",
              border: "none",
              cursor: "pointer",
              transition: "background-color 0.3s",
              fontSize: "1rem",
            }}
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};

// Custom Hooks
const useFormFields = (): [FormData, (field: keyof FormData, value: string) => void, () => void] => {
  const [formData, setFormData] = useState<FormData>({
    societyName: "",
    description: "",
    category: "",
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
      category: "",
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

const societyCategories = [
  { value: "academic", label: "Academic" },
  { value: "cultural", label: "Cultural" },
  { value: "sports", label: "Sports" },
  { value: "arts", label: "Arts & Creative" },
  { value: "community", label: "Community Service" },
  { value: "technology", label: "Technology" },
  { value: "other", label: "Other" },
];

const StartSociety: React.FC = () => {
  const { user } = useAuthStore();
  const theme = useTheme();
  const colours = tokens(theme.palette.mode);
  const isLight = theme.palette.mode === "light";
  const styleProps = { isLight, colours };
  
  const [formData, updateField, resetForm] = useFormFields();
  const [formState, updateFormState] = useFormState();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [isPresident, setIsPresident] = useState(false);
  const [pendingRequestName, setPendingRequestName] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [justSubmitted, setJustSubmitted] = useState(false);
  
  // New state for rejection information
  const [hasRejectedRequest, setHasRejectedRequest] = useState(false);
  const [rejectedRequestName, setRejectedRequestName] = useState<string | undefined>(undefined);
  const [rejectionReason, setRejectionReason] = useState<string | undefined>(undefined);
  const [showRejectionNotice, setShowRejectionNotice] = useState(true);

  // Check if user already has a pending request or is a society president
  useEffect(() => {
    const checkUserStatus = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        const response = await apiClient.get<UserStatusResponse>("/api/society/user-status/");
        
        // Only set pending request if not just submitted
        if (!justSubmitted) {
          setHasPendingRequest(response.data.hasPendingRequest);
          setPendingRequestName(response.data.pendingRequestName);
        }
        
        setIsPresident(response.data.isPresident);
        
        // Set rejection information
        setHasRejectedRequest(response.data.hasRejectedRequest || false);
        setRejectedRequestName(response.data.rejectedRequestName);
        setRejectionReason(response.data.rejectionReason);
      } catch (err) {
        console.error("Failed to check user status:", err);
        updateFormState({ 
          error: "Failed to check your society request status. Please try again later." 
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    checkUserStatus();
  }, [user?.id, justSubmitted]);

  const validateForm = (): boolean => {
    if (!formData.societyName || !formData.description || !formData.category) {
      updateFormState({ error: "Please fill out all fields.", success: "" });
      return false;
    }
    return true;
  };

  const submitSocietyRequest = async () => {
    try {
      updateFormState({ error: "", success: "" });
      
      // Check again if user already has a pending request
      const statusResponse = await apiClient.get<UserStatusResponse>("/api/society/user-status/");
      
      if (statusResponse.data.hasPendingRequest) {
        setHasPendingRequest(true);
        setPendingRequestName(statusResponse.data.pendingRequestName);
        setIsModalOpen(true);
        return;
      }
      
      if (statusResponse.data.isPresident) {
        updateFormState({ 
          error: "You are already a president of a society and cannot create another one." 
        });
        return;
      }
      
      const response = await apiClient.post("/api/society/start", {
        name: formData.societyName,
        description: formData.description,
        category: formData.category,
        requested_by: user?.id,
      });
      
      if (response.status === 201) {
        // Set flag to prevent showing pending message after submission
        setJustSubmitted(true);
        
        // Hide rejection notice if visible
        setShowRejectionNotice(false);
        
        // Update the form state
        updateFormState({ success: "Society creation request submitted successfully!" });
        resetForm();
      }
    } catch (err: any) {
      updateFormState({ 
        error: "Failed to create society. " + 
          (err.response?.data?.error || err.message) 
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (hasPendingRequest && !justSubmitted) {
      setIsModalOpen(true);
      return;
    }
    
    if (isPresident) {
      updateFormState({ 
        error: "You are already a president of a society and cannot create another one." 
      });
      return;
    }
    
    if (validateForm()) {
      await submitSocietyRequest();
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };
  
  const dismissRejectionNotice = () => {
    setShowRejectionNotice(false);
  };

  const getPendingRequestMessage = () => {
    return pendingRequestName 
      ? `You already have a pending request for "${pendingRequestName}". Please wait for admin approval before submitting another request.`
      : "You already have a society creation request pending admin review. Please wait for a response before submitting another request.";
  };

  return (
    <PageContainer styleProps={styleProps}>
      <PageHeader styleProps={styleProps} />
      
      {isLoading ? (
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <p style={{ color: isLight ? colours.grey[100] : colours.grey[100] }}>
            Loading...
          </p>
        </div>
      ) : isPresident ? (
        <div style={{ 
          maxWidth: "640px", 
          margin: "0 auto",
          backgroundColor: isLight ? "#fcfcfc" : "#141b2d",
          padding: "2rem",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          textAlign: "center"
        }}>
          <h2 style={{ 
            color: isLight ? colours.grey[100] : colours.grey[100],
            marginBottom: "1rem"
          }}>
            You're already a society president!
          </h2>
          <p style={{ 
            color: isLight ? colours.grey[200] : colours.grey[200],
            marginBottom: "2rem"
          }}>
            As an existing society president, you cannot create additional societies. 
            Please focus on your current responsibilities.
          </p>
        </div>
      ) : (
        <FormContainer styleProps={styleProps} onSubmit={handleSubmit}>
          <StatusMessages 
            error={formState.error} 
            success={formState.success} 
            styleProps={styleProps} 
          />
          
          {/* Rejection Notice */}
          {hasRejectedRequest && showRejectionNotice && rejectedRequestName && rejectionReason && (
            <RejectionNotice
              rejectedRequestName={rejectedRequestName}
              rejectionReason={rejectionReason}
              styleProps={styleProps}
              onDismiss={dismissRejectionNotice}
            />
          )}
          
          {/* Only show pending request banner if actually pending and not just submitted */}
          {hasPendingRequest && !justSubmitted && (
            <div style={{ 
              backgroundColor: isLight ? colours.blueAccent[100] : colours.blueAccent[900], 
              padding: "1rem", 
              borderRadius: "4px", 
              marginBottom: "1.5rem",
              color: isLight ? colours.grey[900] : "#fff",
              border: `1px solid ${isLight ? colours.blueAccent[300] : colours.blueAccent[700]}`
            }}>
              <p>
                You already have a pending society creation request{pendingRequestName ? ` for "${pendingRequestName}"` : ''}. 
                You'll need to wait for admin approval before submitting another request.
              </p>
            </div>
          )}
          
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
          
          <SelectField
            id="category"
            label="Society Category"
            value={formData.category}
            onChange={(value) => updateField("category", value)}
            options={societyCategories}
            styleProps={styleProps}
          />
    
          <SubmitButton 
            styleProps={styleProps} 
            disabled={hasPendingRequest && !justSubmitted}
          />
        </FormContainer>
      )}
      
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="Request Already Pending"
        message={getPendingRequestMessage()}
        styleProps={styleProps}
      />
    </PageContainer>
  );
};

export default StartSociety;