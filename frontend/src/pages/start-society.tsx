import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const StartSociety: React.FC = () => {
  const navigate = useNavigate();

  const [societyName, setSocietyName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!societyName || !description) {
      setError("Please fill out all fields.");
      return;
    }

    try {
      setError("");
      setSuccess("");

      // Replace this with your actual API endpoint for creating a society
      const response = await axios.post("/api/start-society/", {
        name: societyName,
        description,
      });

      if (response.status === 201) {
        setSuccess("Society creation request submitted successfully!");
        setSocietyName("");
        setDescription("");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } catch (err: any) {
      console.error("Error creating society:", err);
      setError("Failed to create society. Please try again later.");
    }
  };

  const handleBackToDashboard = () => {
    navigate("/student-dashboard");
  };


  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-indigo-100 py-12 px-8">
      <header className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900">Start a Society</h1>
        <p className="text-lg text-gray-600 mt-2">
          Fill out the form below to submit your request for creating a new society.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md"
      >
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {success && <p className="text-green-500 mb-4">{success}</p>}

        <div className="mb-6">
          <label
            htmlFor="societyName"
            className="block text-gray-700 font-medium mb-2"
          >
            Society Name
          </label>
          <input
            type="text"
            id="societyName"
            value={societyName}
            onChange={(e) => setSocietyName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
          />
        </div>

        <div className="mb-6">
          <label
            htmlFor="description"
            className="block text-gray-700 font-medium mb-2"
          >
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
          />
        </div>

        <div className="flex justify-between items-center">
          <button
            type="submit"
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-all"
          >
            Submit Request
          </button>
          <button
            type="button"
            onClick={handleBackToDashboard}
            className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-all"
          >
            Go Back
          </button>
        </div>
      </form>
    </div>
  );
};

export default StartSociety;
