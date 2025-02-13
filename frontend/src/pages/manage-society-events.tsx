import React from "react";
import { useNavigate, useParams } from "react-router-dom";

const ManageSocietyEvents: React.FC = () => {
  const navigate = useNavigate();
  const { society_id } = useParams<{ society_id: string }>();

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      {/* Page Header */}
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Manage Society Events</h1>
      </header>

      {/* Navigation Buttons */}
      <div className="flex flex-col items-center space-y-6">
        <button
          onClick={() => navigate(`/society/${society_id}/create-society-event`)}
          className="bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 transition"
        >
          Create a New Event
        </button>
        <button
          onClick={() => navigate(`/society/${society_id}/upcoming-events`)}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition"
        >
          List of Upcoming Events
        </button>
        <button
          onClick={() => navigate(`/society/${society_id}/previous-events`)}
          className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition"
        >
          List of Previous Events
        </button>
        <button
          onClick={() => navigate(`/society/${society_id}/pending-events`)}
          className="bg-yellow-500 text-white px-6 py-3 rounded-lg hover:bg-yellow-600 transition"
        >
          List of Pending Approval Events
        </button>
      </div>
    </div>
  );
};

export default ManageSocietyEvents;
