import { useEffect, useRef, useState } from "react";
import { Society } from "../types";
import { fetchPendingSocieties } from "../pages/Admin/fetchPendingSocieties";

export type Society = {
    id: number;
    name: string;
    societyMembers: number[];
    roles: {};
    leader: number;
    category: string;
    socialMediaLinks: {};
    timetable: string | null;
    membershipRequirements: string | null;
    upcomingProjectsOrPlans: string | null;
};

export const useFetchPendingSocieties = () => {
    const [societies, setSocieties] = useState<Society[]>([]);
    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            const connectWebSocket = async () => {
                ws.current = new WebSocket("ws://127.0.0.1:8000/ws/admin/society/");

                ws.current.onopen = () => {
                    console.log("WebSocket Connected for Pending Society Requests");
                };

                ws.current.onmessage = async (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        console.log("WebSocket Update Received:", data);
                        // fetchPendingSocieties();
                        setSocieties(await fetchPendingSocieties());
                    } catch (error) {
                        console.error("Error parsing WebSocket message:", error);
                    }
                };

                ws.current.onerror = (event) => {
                    console.error("WebSocket Error:", event);
                };

                ws.current.onclose = (event) => {
                    console.log("WebSocket Disconnected:", event.reason);
                    setTimeout(() => {
                        connectWebSocket();
                    }, 5000);
                };
            };

            // fetchPendingSocieties();
            setSocieties(await fetchPendingSocieties());
            connectWebSocket();
        };

        fetchData();

        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, []);

    return societies;
};