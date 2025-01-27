import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaUsers } from "react-icons/fa";
import axios from "axios";

const JoinSocieties: React.FC = () => {
  const navigate = useNavigate();
  const [societies, setSocieties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  
  useEffect(() => {
    const fetchAvailableSocieties = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/api/join-societies/");
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
      await axios.post(`/api/join-society/${societyId}/`);
      alert("Successfully joined the society!");
      setSocieties((prev) => prev.filter((society) => society.id !== societyId));
    } catch (error) {
      console.error("Error joining society:", error);
      alert("Failed to join the society. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-indigo-100 py-12 px-8">
      <header className="text-center mb-16">
        <h1 className="text-5xl font-extrabold text-gray-900">Join a Society</h1>
        <p className="text-lg text-gray-600 mt-4">
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
