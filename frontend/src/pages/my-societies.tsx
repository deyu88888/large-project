import React from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

const mockSocieties = [
  { id: 1, name: "Basketball Society", description: "A society for basketball lovers." },
  { id: 2, name: "Debate Society", description: "A place to debate and share ideas." },
  { id: 3, name: "Music Society", description: "For those passionate about music." },
  { id: 4, name: "Drama Society", description: "Express yourself through acting!" },
];

const MySocieties: React.FC = () => {
  const navigate = useNavigate();

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

      {/* Societies List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {mockSocieties.map((society) => (
          <div
            key={society.id}
            className="p-6 bg-white rounded-xl shadow hover:shadow-lg border border-gray-200 transition-transform hover:-translate-y-1"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{society.name}</h3>
            <p className="text-gray-600">{society.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MySocieties;
