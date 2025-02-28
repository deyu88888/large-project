import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiClient } from "../api"; // adjust the import based on your project structure
import { useAuthStore } from "../stores/auth-store";

const PresidentPage = () => {
  const navigate = useNavigate();
  const { society_id } = useParams<{ society_id: string }>();
  const [society, setSociety] = useState<any>(null);
  const [pendingMembers, setPendingMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  // Fetch society and pending members on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Use the society_id from the URL if available; otherwise, fall back to user.president_of.
        const id = society_id || user?.president_of;
        if (!id) {
          throw new Error("No society id available");
        }
        // Fetch the society the current president is managing
        const societyResponse = await apiClient.get(`/api/manage-society-details/${id}/`);
        setSociety(societyResponse.data);

        // Fetch pending members for that society
        const pendingResponse = await apiClient.get(`/api/society/${id}/pending-members/`);
        setPendingMembers(pendingResponse.data || []);
      } catch (error) {
        console.error("Error fetching president data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [society_id, user]);

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
        {/* Navigate to the manage society details page (child route of /president-page/:society_id) */}
        <button
          onClick={() => navigate("manage-society-details")}
          className="bg-green-500 text-white px-6 py-3 rounded hover:bg-green-600 transition"
        >
          Manage Society Page
        </button>
        {/* Navigate to the manage society events page */}
        <button
          onClick={() => navigate("manage-society-events")}
          className="bg-green-500 text-white px-6 py-3 rounded hover:bg-green-600 transition"
        >
          Manage Society Events
        </button>
        {/* Navigate to pending members page */}
        <button
          onClick={() => navigate("pending-members")}
          className="bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600 transition"
        >
          Pending Members
        </button>
        {/* Navigate to report to admin page; adjust the route if needed */}
        <button
          onClick={() => navigate("report-to-admin")}
          className="bg-red-500 text-white px-6 py-3 rounded hover:bg-red-600 transition"
        >
          Report to Admin
        </button>
      {/* All Society Members */}
      <button
          onClick={() => navigate("view-society-members")}
          className="bg-purple-500 text-white px-6 py-3 rounded hover:bg-purple-600 transition"
        >
          All Society Members
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
        {pendingMembers.length > 3 && (
          <div className="mt-4">
            <button
              onClick={() => navigate("pending-members")}
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
