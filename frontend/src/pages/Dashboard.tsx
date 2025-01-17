import React, { useEffect, useState } from "react";
import axios from "axios";

interface Stats {
  total_societies: number;
  total_events: number;
  pending_approvals: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch stats from the API
    axios
      .get("/api/dashboard/stats/")
      .then((response) => {
        setStats(response.data);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load dashboard data.");
      });
  }, []);

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Home Dashboard</h1>

      {/* Display Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats ? (
          <>
            <div className="bg-white shadow p-4 rounded">
              <p className="text-gray-500">Total Societies</p>
              <p className="text-xl font-bold">{stats.total_societies}</p>
            </div>
            <div className="bg-white shadow p-4 rounded">
              <p className="text-gray-500">Total Events</p>
              <p className="text-xl font-bold">{stats.total_events}</p>
            </div>
            <div className="bg-white shadow p-4 rounded">
              <p className="text-gray-500">Pending Approvals</p>
              <p className="text-xl font-bold">{stats.pending_approvals}</p>
            </div>
          </>
        ) : (
          <div className="col-span-3 text-gray-500">Loading...</div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
