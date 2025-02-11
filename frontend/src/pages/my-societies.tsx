import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { apiClient } from "../api"; // Ensure you import apiClient for API calls

const MySocieties: React.FC = () => {
  const navigate = useNavigate();
  const [societies, setSocieties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-indigo-100 py-12 px-8">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <button
          onClick={handleBackToDashboard}
          className="flex items-center text-blue-500 hover:underline font-medium"
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
