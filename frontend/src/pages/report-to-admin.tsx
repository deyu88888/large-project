import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../api";

const ReportToAdmin: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    report_type: "Misconduct",
    subject: "",
    details: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post("/api/report-to-admin", formData);
      alert("Report submitted successfully!");
      navigate(-1);  // ✅ Go back to the previous page
    } catch (error) {
      console.error("Error submitting report:", error);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Report to Admin</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Report Type */}
        <div>
          <label className="block text-lg font-medium">Type of Report</label>
          <select name="report_type" value={formData.report_type} onChange={handleChange} className="w-full border p-2 rounded">
            <option value="Misconduct">Misconduct</option>
            <option value="System Issue">System Issue</option>
            <option value="Society Issue">Society Issue</option>
            <option value="Event Issue">Event Issue</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-lg font-medium">Subject</label>
          <input type="text" name="subject" value={formData.subject} onChange={handleChange} className="w-full border p-2 rounded" required />
        </div>

        {/* Details */}
        <div>
          <label className="block text-lg font-medium">Report Details</label>
          <textarea name="details" value={formData.details} onChange={handleChange} className="w-full border p-2 rounded" rows={5} required></textarea>
        </div>

        {/* Submit Button */}
        <button type="submit" className="bg-red-500 text-white px-6 py-3 rounded hover:bg-red-600 transition">
          Submit Report
        </button>
      </form>
    </div>
  );
};

export default ReportToAdmin;
