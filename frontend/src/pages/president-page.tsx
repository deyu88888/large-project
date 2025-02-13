import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../api"; // adjust the import based on your project structure
import { useAuthStore } from "../stores/auth-store";



const PresidentPage = () => {
  const navigate = useNavigate();
  const [society, setSociety] = useState(null);
  const [pendingMembers, setPendingMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();


  // Fetch society and pending members on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch the society the current president is managing
        const societyResponse = await apiClient.get("/api/my-society/");
        setSociety(societyResponse.data);

        // Fetch pending members for that society
        const pendingResponse = await apiClient.get("/api/society/pending-members/");
        setPendingMembers(pendingResponse.data || []);
      } catch (error) {
        console.error("Error fetching president data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading President Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      {/* Society Name */}
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900">
          {society ? society.name : "My Society"}
        </h1>
      </header>

      {/* Navigation Buttons */}
      <div className="flex justify-center space-x-4 mb-8">
        <button
          onClick={() => navigate(`/manage-society-details/${user?.president_of}/`)}
          className="bg-green-500 text-white px-6 py-3 rounded hover:bg-green-600 transition"
        >
          Manage Society Page
        </button>
        <button
          onClick={() => navigate(`/manage-society-events/${user?.president_of}/`)}
          className="bg-green-500 text-white px-6 py-3 rounded hover:bg-green-600 transition"
        >
          Manage Society Events
        </button>
        <button
          onClick={() => navigate(`/api/society/${user?.president_of}/pending-members/`)}
          className="bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600 transition"
        >
          Pending Members
        </button>
        <button
          onClick={() => navigate("/manage-society-details")}
          className="bg-red-500 text-white px-6 py-3 rounded hover:bg-red-600 transition"
        >
          Report to Admin
        </button>
      </div>

      {/* Pending Members Preview */}
      <section className="max-w-3xl mx-auto bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-semibold mb-4">Pending Members (Preview)</h2>
        {pendingMembers.length === 0 ? (
          <p className="text-gray-600">No pending membership requests.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {pendingMembers.slice(0, 3).map((member) => (
              <li key={member.id} className="py-2">
                <p className="font-medium">
                  {member.first_name} {member.last_name}
                </p>
                <p className="text-sm text-gray-500">{member.username}</p>
              </li>
            ))}
          </ul>
        )}
        {/* Optionally, add a button to view all pending members */}
        {pendingMembers.length > 3 && (
          <div className="mt-4">
            <button
              onClick={() => navigate("/pending-members")}
              className="text-blue-500 hover:underline"
            >
              View All Pending Members
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default PresidentPage;
