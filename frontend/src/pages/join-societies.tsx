import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaUsers } from "react-icons/fa";
import axios from "axios";
import { apiClient } from "../api";

// Import the theme
import { useTheme } from "@mui/material/styles";
import { tokens } from "../styles/theme";

const JoinSocieties: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const colours = tokens(theme.palette.mode);
  const isLight = theme.palette.mode === "light";

  const [societies, setSocieties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  
  useEffect(() => {
    const fetchAvailableSocieties = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get("/api/join-society/");
        setSocieties(response.data);
      } catch (error) {
        console.error("Error fetching societies:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAvailableSocieties();
  }, []);

  
  const handleJoinSociety = async (societyId: number) => {
    try {
      await apiClient.post(`/api/join-society/${societyId}/`);
      alert("Successfully joined the society!");
      setSocieties((prev) => prev.filter((society) => society.id !== societyId));
    } catch (error) {
      console.error("Error joining society:", error);
      alert("Failed to join the society. Please try again.");
    }
  };

  return (
    <div
      style={{
        marginLeft: "0px",
        marginTop: "0px",
        transition: "margin-left 0.3s ease-in-out",
        minHeight: "100vh",
        padding: "20px 40px",
        backgroundColor: isLight ? colours.primary[1000] : colours.primary[500],
      }}
    >
      <div style={{ maxWidth: "1920px", margin: "0 auto" }}>
        <header
          style={{
            textAlign: "center",
            marginBottom: "2.5rem",
            padding: "2rem 0",
          }}
        >
          <h1
            style={{
              color: isLight ? colours.grey[100] : colours.grey[100],
              fontSize: "2.25rem",
              fontWeight: 700,
              marginBottom: "0.5rem",
            }}
          >
            Join a Society
          </h1>
          <p
            style={{
              color: isLight ? colours.grey[100] : colours.grey[100],
              fontSize: "1.125rem",
              margin: 0,
            }}
          >
            Discover new societies and connect with your peers!
          </p>
        </header>

      {loading ? (
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">Loading societies...</h2>
        </div>
      ) : societies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {societies.map((society) => (
            <div
              key={society.id}
              className="p-6 bg-white rounded-xl shadow hover:shadow-lg border border-gray-200 transition-transform hover:-translate-y-1"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-4">{society.name}</h3>
              <p className="text-gray-600 mb-4">{society.description || "No description available."}</p>
              <button
                onClick={() => handleJoinSociety(society.id)}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-all"
              >
                Join Society
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">No societies available to join.</h2>
        </div>
      )}

      <div className="mt-12 text-center">
        <button
          onClick={() => navigate("/student-dashboard")}
          className="bg-gray-300 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-400 transition-all"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default JoinSocieties;
