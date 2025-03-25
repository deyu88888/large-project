import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { apiClient } from "../../api";
import { PendingMember } from "../../types/president/member";

// interface PendingMember {
//   id: number;
//   first_name: string;
//   last_name: string;
//   username: string;
// }

const PendingMembers: React.FC = () => {
  const { societyId } = useParams<{ societyId: string }>();
  const [pendingMembers, setPendingMembers] = useState<PendingMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!societyId) {
      console.error("societyId is missing from URL params");
      setError("Missing society ID parameter");
      setLoading(false);
      return;
    }

    fetchPendingMembers();
  }, [societyId]); 

  const fetchPendingMembers = async (): Promise<void> => {
    try {
      const response = await apiClient.get(`/api/society/${societyId}/pending-members/`);
      setPendingMembers(response.data);
    } catch (error) {
      console.error("Error fetching pending members:", error);
      setError("Failed to load pending members");
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (memberId: number, approved: boolean): Promise<void> => {
    try {
      const action = approved ? "approve" : "reject";
      await apiClient.post(`/api/society/${societyId}/pending-members/${memberId}/`, { action });
      fetchPendingMembers();
    } catch (error) {
      console.error("Error updating member status:", error);
    }
  };

  if (error) {
    return (
      <div className="container mx-auto p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (loading) return <p>Loading pending members...</p>;

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Pending Members</h1>
      {pendingMembers.length === 0 ? (
        <p>No pending membership requests.</p>
      ) : (
        <ul className="space-y-4">
          {pendingMembers.map((member) => (
            <li key={member.id} className="p-4 bg-white shadow rounded flex justify-between">
              <div>
                <p className="font-medium">{member.first_name} {member.last_name}</p>
                <p className="text-sm text-gray-500">{member.username}</p>
              </div>
              <div>
                <button
                  className="bg-green-500 text-white px-4 py-2 rounded mr-2 hover:bg-green-600"
                  onClick={() => handleApproval(member.id, true)}
                >
                  Accept
                </button>
                <button
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  onClick={() => handleApproval(member.id, false)}
                >
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PendingMembers;