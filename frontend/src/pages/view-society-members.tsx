import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiClient } from "../api"; // adjust import as needed
import { useAuthStore } from "../stores/auth-store";

const ViewSocietyMembers = () => {
  const { society_id } = useParams<{ society_id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [society, setSociety] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        // Determine society id either from the URL or the logged in user
        const id = society_id || user?.president_of;
        if (!id) {
          throw new Error("No society id available");
        }
        // Fetch society details (if needed)
        // const societyResponse = await apiClient.get(`/api/manage-society-details/${id}/`);
        // setSociety(societyResponse.data);

        // Fetch all members of the society using an assumed endpoint
        const membersResponse = await apiClient.get(`/api/society/${id}/members/`);
        setMembers(membersResponse.data || []);
      } catch (error) {
        console.error("Error fetching society members:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [society_id, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading Society Members...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      {/* Header with Society Name */}
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900">
          {society ? society.name : "Society"} Members
        </h1>
      </header>

      {/* Members List */}
      <section className="max-w-3xl mx-auto bg-white p-6 rounded shadow">
        {members.length === 0 ? (
          <p className="text-gray-600">No members found.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {members.map((member) => (
              <li key={member.id} className="py-2">
                <p className="font-medium">
                  {member.first_name} {member.last_name}
                </p>
                <p className="text-sm text-gray-500">{member.username}</p>
              </li>
            ))}
          </ul>
        )}
        {/* Back button */}
        <div className="mt-4">
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </section>
    </div>
  );
};

export default ViewSocietyMembers;
