import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../theme/theme";

const StartSociety: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const colours = tokens(theme.palette.mode);
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
      const response = await axios.post("/api/start-society", {
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
          maxWidth: "640px",
          margin: "0 auto",
          backgroundColor: isLight ? "#fcfcfc" : "#141b2d",
          padding: "2rem",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        }}
      >
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
        <div style={{ marginBottom: "1.5rem" }}>
          <label
            htmlFor="societyName"
            style={{
              display: "block",
              color: isLight ? "#000" : "#fff",
              fontWeight: 500,
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
              padding: "0.5rem 1rem",
              border: `1px solid ${colours.grey[300]}`,
              borderRadius: "4px",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
              outline: "none",
              fontSize: "1rem",
              color: isLight ? "#000" : "#fff",
              backgroundColor: isLight ? "#fcfcfc" : "#141b2d",
            }}
          />
        </div>
        <div style={{ marginBottom: "1.5rem" }}>
          <label
            htmlFor="description"
            style={{
              display: "block",
              color: isLight ? "#000" : "#fff",
              fontWeight: 500,
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
              padding: "0.5rem 1rem",
              border: `1px solid ${colours.grey[300]}`,
              borderRadius: "4px",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
              outline: "none",
              fontSize: "1rem",
              color: isLight ? "#000" : "#fff",
              backgroundColor: isLight ? "#fcfcfc" : "#141b2d",
            }}
          />
        </div>
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
      </form>
    </div>
  );
};

export default StartSociety;
