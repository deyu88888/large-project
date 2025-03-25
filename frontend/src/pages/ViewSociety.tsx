import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { apiClient } from "../api";
import SocietyDetailLayout from "../components/SocietyDetailLayout";

const ViewSociety: React.FC = () => {
  const [society, setSociety] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState<number>(0);
  const { society_id } = useParams<{ society_id: string }>();
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    const fetchSocietyData = async (societyId: number) => {
      try {
        setLoading(true);
        const response = await apiClient.get("/api/society/view/" + societyId);
        setSociety(response.data);
        if (response.data.is_member === 2) {
          setJoined(2);
        } else if (response.data.is_member === 1) {
          setJoined(1);
        } else {
          setJoined(0);
        }
      } catch (error) {
        console.error("Error retrieving society:", error);
        alert("Failed to load society. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    if (society_id) {
      fetchSocietyData(Number(society_id));
    }
  }, [society_id]);

  const handleJoinSociety = async (societyId: number) => {
    try {
      const response = await apiClient.post(`/api/society/join/${societyId}/`);
      if (response.data.message) {
        alert(response.data.message);
      } else {
        setJoined(1);
        alert("Successfully requested to join the society!");
      }
    } catch (error: any) {
      console.error("Error joining society:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to join the society. Please try again.";
      
      alert(errorMessage);
    }
  };

  return (
    <SocietyDetailLayout
      society={society}
      loading={loading}
      joined={joined}
      onJoinSociety={handleJoinSociety}
    />
  );
};

export default ViewSociety;
