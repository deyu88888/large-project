import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiClient } from "../api";

const roles = [
  { key: "vice_president", label: "Vice President" },
  { key: "event_manager", label: "Event Manager" },
  { key: "treasurer", label: "Treasurer" },
];

const AssignSocietyRole = () => {
  const { society_id, student_id } = useParams<{ society_id: string; student_id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAssignRole = async (roleKey: string) => {
    try {
      setLoading(true);
      // Prepare payload. The key is the role field name and the value is the student id (as a number).
      const payload: Record<string, any> = {};
      payload[roleKey] = Number(student_id);

      // Make a PATCH request to update the society with the new role assignment.
      await apiClient.patch(`/api/manage-society-details/${society_id}`, payload);
      alert(`Assigned ${roleKey.replace("_", " ")} role to student ${student_id}`);
      navigate(-1);
    } catch (err: any) {
      console.error("Error assigning role", err.response?.data || err);
      setError("Failed to assign role. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Assign Society Role</h1>
        <p>Choose a role to assign to student with ID: {student_id}</p>
      </header>

      {error && (
        <div className="mb-4 text-center">
          <p className="text-red-500">{error}</p>
        </div>
      )}

      <section className="max-w-md mx-auto bg-white p-6 rounded shadow">
        <div className="flex flex-col space-y-4">
          {roles.map((role) => (
            <button
              key={role.key}
              onClick={() => handleAssignRole(role.key)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
              disabled={loading}
            >
              {role.label}
            </button>
          ))}
        </div>
      </section>

      <div className="mt-4 text-center">
        <button
          onClick={() => navigate(-1)}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
          disabled={loading}
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default AssignSocietyRole;
