import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
// MUI/theme imports
import { useTheme } from "@mui/material/styles";
import { tokens } from "../styles/theme";
import { useSidebar } from "../components/layout/SidebarContext";

const StartSociety: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const colours = tokens(theme.palette.mode);
  const { sidebarWidth } = useSidebar();
  const isLight = theme.palette.mode === "light";

  const [societyName, setSocietyName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!societyName || !description) {
      setError("Please fill out all fields.");
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response = await axios.post("/api/start-society/", {
        name: societyName,
        description,
      });

      if (response.status === 201) {
        setSuccess("Society creation request submitted successfully!");
        setSocietyName("");
        setDescription("");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } catch (err: any) {
      console.error("Error creating society:", err);
      setError("Failed to create society. Please try again later.");
    }
  };

  const handleBackToDashboard = () => {
    navigate("/student-dashboard");
  };

  return (
    <div
      style={{
        marginLeft: `${sidebarWidth}px`,
        marginTop: "0px",
        transition: "margin-left 0.3s ease-in-out",
        minHeight: "100vh",
        padding: "3rem 2rem",
        backgroundColor: isLight ? colours.primary[1000] : colours.primary[500],
      }}
    >
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

      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: isLight ? colours.primary[400] : colours.primary[400],
          maxWidth: "40rem",
          margin: "0 auto",
          padding: "2rem",
          borderRadius: "0.75rem",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        {error && (
          <p
            style={{ color: colours.redAccent[500], marginBottom: "1rem" }}
          >
            {error}
          </p>
        )}
        {success && (
          <p
            style={{ color: colours.greenAccent[500], marginBottom: "1rem" }}
          >
            {success}
          </p>
        )}

        <div style={{ marginBottom: "1.5rem" }}>
          <label
            htmlFor="societyName"
            style={{
              display: "block",
              fontWeight: "500",
              color: isLight ? colours.grey[100] : colours.grey[100],
              marginBottom: "0.5rem",
            }}
          >
            Society Name
          </label>
          <input
            type="text"
            id="societyName"
            value={societyName}
            onChange={(e) => setSocietyName(e.target.value)}
            style={{
              width: "100%",
              padding: "0.5rem 0.75rem",
              border: `1px solid ${isLight ? colours.grey[300] : colours.grey[700]}`,
              borderRadius: "0.375rem",
              outline: "none",
              backgroundColor: isLight ? "#ffffff" : colours.primary[600],
              color: isLight ? colours.primary[700] : colours.grey[100],
            }}
          />
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label
            htmlFor="description"
            style={{
              display: "block",
              fontWeight: "500",
              color: isLight ? colours.grey[100] : colours.grey[100],
              marginBottom: "0.5rem",
            }}
          >
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            style={{
              width: "100%",
              padding: "0.5rem 0.75rem",
              border: `1px solid ${isLight ? colours.grey[300] : colours.grey[700]}`,
              borderRadius: "0.375rem",
              outline: "none",
              backgroundColor: isLight ? "#ffffff" : colours.primary[600],
              color: isLight ? colours.primary[700] : colours.grey[100],
            }}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            type="submit"
            style={{
              backgroundColor: isLight ? colours.blueAccent[400] : colours.blueAccent[500],
              color: isLight ? "#ffffff" : colours.grey[100],
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              transition: "all 0.2s ease",
              border: "none",
              cursor: "pointer",
            }}
          >
            Submit Request
          </button>
          <button
            type="button"
            onClick={handleBackToDashboard}
            style={{
              backgroundColor: isLight ? colours.grey[300] : colours.grey[700],
              color: isLight ? colours.primary[700] : colours.grey[100],
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              transition: "all 0.2s ease",
              border: "none",
              cursor: "pointer",
            }}
          >
            Go Back
          </button>
        </div>
      </form>
    </div>
  );
};

export default StartSociety;