import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiClient } from "../api"; // adjust import as needed

interface Award {
  id: number;
  rank: string;
  title: string;
  description: string;
  is_custom: boolean;
}

const GiveAwardPage = () => {
  const { student_id } = useParams<{ student_id: string }>();
  const navigate = useNavigate();
  const [awards, setAwards] = useState<Award[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all available awards on component mount
  useEffect(() => {
    const fetchAwards = async () => {
      try {
        const response = await apiClient.get("/api/awards");
        setAwards(response.data);
      } catch (err) {
        console.error("Error fetching awards", err);
        setError("Failed to load awards.");
      } finally {
        setLoading(false);
      }
    };

    fetchAwards();
  }, []);

  // Handler to assign an award to the student
  const handleGiveAward = async (awardId: number) => {
    try {
      // POST to assign the award to the student
        const studentIdNumber = Number(student_id);
        await apiClient.post("/api/award-students", {
        student_id: studentIdNumber,
        award_id: awardId,
      });
      alert("Award assigned successfully!");
      // Navigate back or to another page as needed
      navigate(-1);
    } catch (err) {
      console.error("Error giving award", err);
      alert("Failed to assign award.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading awards...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Select an Award</h1>
        <p>Choose an award to give to the student.</p>
      </header>

      <section className="max-w-3xl mx-auto bg-white p-6 rounded shadow">
        {awards.length === 0 ? (
          <p className="text-gray-600">No awards available.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {awards.map((award) => (
              <li key={award.id} className="py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {award.title} ({award.rank})
                  </p>
                  <p className="text-sm text-gray-500">{award.description}</p>
                </div>
                <button
                  onClick={() => handleGiveAward(award.id)}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
                >
                  Give Award
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-4 text-center">
        <button
          onClick={() => navigate(-1)}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default GiveAwardPage;
