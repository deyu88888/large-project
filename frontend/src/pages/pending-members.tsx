import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { apiClient } from "../api";

interface PendingMember {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
}

const PendingMembers: React.FC = () => {
  const { society_id } = useParams(); // ✅ Get society_id from URL
  const [pendingMembers, setPendingMembers] = useState<PendingMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchPendingMembers();
  }, [society_id]); // ✅ Refetch when society_id changes

  const fetchPendingMembers = async () => {
    try {
      const response = await apiClient.get(`/api/society/${society_id}/pending-members/`);
      setPendingMembers(response.data);
    } catch (error) {
      console.error("Error fetching pending members:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (memberId: number, approved: boolean) => {
    try {
      await apiClient.post(`/api/society/${society_id}/pending-members/${memberId}/`, {
        approved: approved,
      });

      // ✅ Refresh the pending members list after approval/rejection
      fetchPendingMembers();
    } catch (error) {
      console.error("Error updating member status:", error);
    }
  };

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
