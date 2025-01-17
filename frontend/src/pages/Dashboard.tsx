import React, { useEffect, useState } from "react";
import axios from "axios";

interface Stats {
  total_societies: number;
  total_events: number;
  pending_approvals: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axios
      .get("/api/dashboard/stats/")
      .then((response) => {
        setStats(response.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load dashboard data.");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-6 text-gray-500">Loading Dashboard...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Home Dashboard</h1>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-blue-100 shadow p-4 rounded text-center">
          <p className="text-gray-500">Total Societies</p>
          <p className="text-3xl font-bold">{stats?.total_societies || 0}</p>
        </div>
        <div className="bg-green-100 shadow p-4 rounded text-center">
          <p className="text-gray-500">Total Events</p>
          <p className="text-3xl font-bold">{stats?.total_events || 0}</p>
        </div>
        <div className="bg-yellow-100 shadow p-4 rounded text-center">
          <p className="text-gray-500">Pending Approvals</p>
          <p className="text-3xl font-bold">{stats?.pending_approvals || 0}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
