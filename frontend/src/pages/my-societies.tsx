import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { apiClient } from "../api";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../styles/theme";
// Removed: import { useSidebar } from "../components/layout/SidebarContext";

const MySocieties: React.FC = () => {
  const navigate = useNavigate();
  const [societies, setSocieties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const colours = tokens(theme.palette.mode);
  const isLight = theme.palette.mode === "light";

  useEffect(() => {
    fetchSocieties();
  }, []);

  const fetchSocieties = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/api/student-societies/"); // Fetch joined societies
      console.log("Fetched societies:", response.data); // Debugging: See the API response
      setSocieties(response.data || []);
    } catch (error) {
      console.error("Error fetching societies:", error);
    } finally {
      setLoading(false);
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
        padding: "20px 40px",
        backgroundColor: isLight ? colours.primary[1000] : colours.primary[500],
      }}
    >
      <div style={{ maxWidth: "1920px", margin: "0 auto" }}>
        {/* Header */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "2rem",
          }}
        >
          <FaArrowLeft className="mr-2" />
          Back to Dashboard
        </button>
        <h1 className="text-4xl font-extrabold text-gray-900">My Societies</h1>
      </header>

      {/* Show Loading State */}
      {loading ? (
        <p className="text-center text-gray-600">Loading societies...</p>
      ) : societies.length === 0 ? (
        <p className="text-center text-gray-600">You haven't joined any societies yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {societies.map((society) => (
            <div
              key={society.id}
              className="p-6 bg-white rounded-xl shadow hover:shadow-lg border border-gray-200 transition-transform hover:-translate-y-1"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{society.name}</h3>
              <p className="text-gray-600">{society.description || "No description available."}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MySocieties;
