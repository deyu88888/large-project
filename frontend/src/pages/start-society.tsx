import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
// MUI/theme imports
import { useTheme } from "@mui/material/styles";
import { tokens } from "../theme/theme";

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

      // Replace this with your actual API endpoint for creating a society
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
        marginLeft: "0px", // Removed sidebarWidth dependency; set to "0px"
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
        className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md"
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

        <div className="mb-6">
          <label
            htmlFor="societyName"
            className="block text-gray-700 font-medium mb-2"
          >
            Society Name
          </label>
          <input
            type="text"
            id="societyName"
            value={societyName}
            onChange={(e) => setSocietyName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
          />
        </div>

        <div className="mb-6">
          <label
            htmlFor="description"
            className="block text-gray-700 font-medium mb-2"
          >
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
          />
        </div>

        <div className="flex justify-between items-center">
          <button
            type="submit"
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-all"
          >
            Submit Request
          </button>
          <button
            type="button"
            onClick={handleBackToDashboard}
            className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-all"
          >
            Go Back
          </button>
        </div>
      </form>
    </div>
  );
};

export default StartSociety;
