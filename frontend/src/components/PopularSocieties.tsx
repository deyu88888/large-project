import React, { useEffect, useState } from "react";
import { useTheme } from "@mui/material/styles";
import { getPopularSocieties } from "../api";

interface Society {
  id: number;
  name: string;
  total_members: number;
  total_events: number;
  total_event_attendance: number;
  popularity_score: number;
}

const PopularSocieties: React.FC = () => {
  const [popularSocieties, setPopularSocieties] = useState<Society[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Access the current MUI theme
  const theme = useTheme();

  // Set background color dynamically
  const backgroundClass =
    theme.palette.mode === "dark" ? "bg-[#141b2d]" : "bg-[#ffffff]";

  // Set text color dynamically
  const headerTextClass =
    theme.palette.mode === "dark" ? "text-white" : "text-black";

  useEffect(() => {
    const fetchPopularSocieties = async () => {
      try {
        const data = await getPopularSocieties();
        setPopularSocieties(data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch popular societies.");
        setLoading(false);
      }
    };

    fetchPopularSocieties();
  }, []);

  if (loading) {
    return (
      <p className="text-center text-lg text-gray-600">
        Loading popular societies...
      </p>
    );
  }

  if (error) {
    return <p className="text-center text-lg text-red-500">{error}</p>;
  }

  return (
    <div
      className={`${backgroundClass} backdrop-blur-lg rounded-2xl shadow-2xl p-8`}
    >
      <h2 className={`text-3xl font-extrabold flex items-center gap-3 mb-6 ${headerTextClass}`}>
        <span role="img" aria-label="trophy" className="text-5xl">
          🏆
        </span>
        Most Popular Societies
      </h2>
      {popularSocieties.length === 0 ? (
        <p className="text-center text-gray-500">No popular societies found.</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {popularSocieties.map((society) => (
            <li
              key={society.id}
              className="bg-gradient-to-r from-gray-100 to-gray-200 p-6 rounded-2xl shadow-lg transform transition duration-300 hover:scale-105 hover:shadow-2xl"
            >
              <div className="flex flex-col justify-between h-full">
                <div>
                  <p className="text-2xl font-bold text-gray-800">{society.name}</p>
                  <p className="mt-2 text-base text-gray-600">
                    <span className="font-semibold">{society.total_members}</span>{" "}
                    Members •{" "}
                    <span className="font-semibold">{society.total_events}</span>{" "}
                    Events •{" "}
                    <span className="font-semibold">
                      {society.total_event_attendance}
                    </span>{" "}
                    Attendees
                  </p>
                </div>
                <div className="mt-4 text-right">
                  <span className="inline-block bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-lg font-semibold px-4 py-2 rounded-full shadow-md">
                    Score: {society.popularity_score}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PopularSocieties;
