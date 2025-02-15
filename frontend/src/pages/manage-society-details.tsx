import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiClient, apiPaths } from "../api";
import { useAuthStore } from "../stores/auth-store";

interface SocietyData {
  id: number;
  name: string;
  category: string;
  social_media_links: Record<string, string>;
  timetable: string;
  membership_requirements: string;
  upcoming_projects_or_plans: string;
  tags: string[];
  icon: string | File | null;
}

const ManageSocietyDetails: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { society_id } = useParams<{ society_id: string }>();
  const societyId = Number(society_id);

  const [society, setSociety] = useState<SocietyData | null>(null);
  const [formData, setFormData] = useState<SocietyData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    console.log("Debug: society_id from useParams:", society_id);
    console.log("Debug: converted societyId:", societyId);
    fetchSociety();
  }, []);

  const fetchSociety = async () => {
    console.log("Fetching society details for societyId:", societyId);
    try {
      setLoading(true);
      // FIX: Include the societyId in the API endpoint
      const response = await apiClient.get(apiPaths.SOCIETY.MANAGE_DETAILS(societyId));
      console.log("Response received:", response);
      console.log("Response data:", response.data);
      setSociety(response.data);
      setFormData({
        ...response.data,
        social_media_links: response.data.social_media_links || {},
        tags: response.data.tags || [],
      });
    } catch (error) {
      console.error("Error fetching society details", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevFormData) =>
      prevFormData ? { ...prevFormData, [name]: value } : null
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData || !society) return;
    try {
      setSaving(true);

      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("category", formData.category);
      formDataToSend.append("timetable", formData.timetable);
      formDataToSend.append("membership_requirements", formData.membership_requirements);
      formDataToSend.append("upcoming_projects_or_plans", formData.upcoming_projects_or_plans);
      formDataToSend.append("tags", JSON.stringify(formData.tags)); // Convert array to string

      // Append social media links
      Object.entries(formData.social_media_links).forEach(([platform, link]) => {
        formDataToSend.append(`social_media_links[${platform}]`, link);
      });

      // Append icon if it's a file
      if (formData.icon && formData.icon instanceof File) {
        formDataToSend.append("icon", formData.icon);
      }

      const response = await apiClient.put(`/api/manage-society-details/${societyId}/`, formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSociety(response.data);
      alert("Society updated successfully!");
      // FIX: Navigate back using the society ID from the URL
      navigate(`/president-page/${societyId}`);
    } catch (error) {
      console.error("Error updating society", error);
      alert("There was an error updating your society.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !formData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading society details...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Manage My Society</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Society Name */}
        <div>
          <label className="block text-lg font-medium mb-1">Society Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Icon Upload */}
        <div>
          <label className="block text-lg font-medium mb-1">Society Icon</label>
          <input
            type="file"
            name="icon"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setFormData((prevFormData) =>
                  prevFormData ? { ...prevFormData, icon: e.target.files[0] } : null
                );
              }
            }}
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Show existing icon */}
        {formData?.icon && typeof formData.icon === "string" && (
          <div className="mt-2">
            <p className="text-sm text-gray-600">Current Icon:</p>
            <img src={formData.icon} alt="Society Icon" className="w-24 h-24 rounded-md" />
          </div>
        )}

        {/* Category */}
        <div>
          <label className="block text-lg font-medium mb-1">Category</label>
          <input
            type="text"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Social Media Links (Dynamic Fields) */}
        <div>
          <label className="block text-lg font-medium mb-1">Social Media Links</label>
          {Object.entries(formData?.social_media_links || {}).map(([platform, link]) => (
            <div key={platform} className="mb-2">
              <label className="block text-sm font-medium text-gray-600">{platform.toUpperCase()} URL</label>
              <input
                type="text"
                name={platform}
                value={link || ""}
                onChange={(e) => {
                  const updatedLinks = {
                    ...formData.social_media_links,
                    [platform]: e.target.value,
                  };
                  setFormData((prevFormData) =>
                    prevFormData ? { ...prevFormData, social_media_links: updatedLinks } : null
                  );
                }}
                className="w-full border p-2 rounded"
              />
            </div>
          ))}
        </div>

        {/* Timetable */}
        <div>
          <label className="block text-lg font-medium mb-1">Timetable</label>
          <textarea
            name="timetable"
            value={formData.timetable}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          ></textarea>
        </div>

        {/* Membership Requirements */}
        <div>
          <label className="block text-lg font-medium mb-1">Membership Requirements</label>
          <textarea
            name="membership_requirements"
            value={formData.membership_requirements}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          ></textarea>
        </div>

        {/* Upcoming Projects or Plans */}
        <div>
          <label className="block text-lg font-medium mb-1">Upcoming Projects or Plans</label>
          <textarea
            name="upcoming_projects_or_plans"
            value={formData.upcoming_projects_or_plans}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          ></textarea>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-lg font-medium mb-1">Tags (comma separated)</label>
          <input
            type="text"
            name="tags"
            value={formData.tags.join(", ")}
            onChange={(e) =>
              setFormData({
                ...formData,
                tags: e.target.value.split(",").map((tag) => tag.trim()),
              })
            }
            className="w-full border p-2 rounded"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
};

export default ManageSocietyDetails;
