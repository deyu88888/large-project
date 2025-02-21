import React, { useState, ChangeEvent, FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiClient } from "../api";

const CreateEvent: React.FC = () => {
  const navigate = useNavigate();
  const { society_id } = useParams<{ society_id: string }>();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    start_time: "",
    duration: "01:00:00", // Default to 1 hour
    location: "",
    max_capacity: 0,
    admin_reason: "", // Admin-only reason field
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post(`/api/society/${society_id}/create-society-event/`, {
        ...formData,
        hosted_by: society_id,
      });

      alert("Event created successfully!");
      navigate(-1); // Navigate back to the previous page
    } catch (error) {
      console.error("Error creating event:", error);
      alert("Failed to create event.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create a New Event</h1>
      </header>
      <form onSubmit={handleSubmit} className="max-w-lg mx-auto bg-white p-6 rounded shadow">
        {/* Event Title */}
        <div className="mb-4">
          <label className="block text-lg font-medium mb-1">Event Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            maxLength={20}
            required
          />
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="block text-lg font-medium mb-1">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            maxLength={300}
            required
          ></textarea>
        </div>

        {/* Date */}
        <div className="mb-4">
          <label className="block text-lg font-medium mb-1">Date</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          />
        </div>

        {/* Start Time */}
        <div className="mb-4">
          <label className="block text-lg font-medium mb-1">Start Time</label>
          <input
            type="time"
            name="start_time"
            value={formData.start_time}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          />
        </div>

        {/* Duration */}
        <div className="mb-4">
          <label className="block text-lg font-medium mb-1">Duration (HH:MM:SS)</label>
          <input
            type="text"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          />
        </div>

        {/* Location */}
        <div className="mb-4">
          <label className="block text-lg font-medium mb-1">Location</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          />
        </div>

        {/* Max Capacity */}
        <div className="mb-4">
          <label className="block text-lg font-medium mb-1">Max Capacity (0 = No Limit)</label>
          <input
            type="number"
            name="max_capacity"
            value={formData.max_capacity}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            min="0"
            required
          />
        </div>

        {/* Admin-Only Section */}
        <div className="mt-6 border-t border-gray-300 pt-4">
          <h2 className="text-lg font-semibold text-gray-700">For Admin View Only:</h2>
          <label className="block text-lg font-medium mt-2">Why do you want to create this event?</label>
          <textarea
            name="admin_reason"
            value={formData.admin_reason}
            onChange={handleChange}
            className="w-full border p-2 rounded h-24"
            required
          ></textarea>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="mt-6 w-full bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition"
        >
          Submit
        </button>
      </form>
    </div>
  );
};

export default CreateEvent;
