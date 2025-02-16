// Moved fetchData and WebSocket connection outside the custom hook

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

// Fetch data function moved outside the hook
export const fetchData = async (setSocieties: (societies: Society[]) => void) => {
    const societies = await fetchPendingSocieties();
    setSocieties(societies);
    console.log("fetchData executed successfully, societies updated.");
};

// WebSocket event handlers
export const handleOpen = () => {
    console.log("WebSocket Connected for Pending Society Requests");
};

export const handleMessage = async (event: MessageEvent, setSocieties: (societies: Society[]) => void) => {
    try {
        const data = JSON.parse(event.data);
        console.log("WebSocket Update Received:", data);
        await fetchData(setSocieties);
    } catch (error) {
        console.error("Error parsing WebSocket message:", error);
    }
};

export const handleError = (event: Event) => {
    console.error("WebSocket Error:", event);
};

export const handleClose = (event: CloseEvent, setSocieties: (societies: Society[]) => void, ws: React.MutableRefObject<WebSocket | null>) => {
    console.log("WebSocket Disconnected:", event.reason);
    setTimeout(() => {
        connectWebSocket(setSocieties, ws);
    }, 5000);
};

// WebSocket connection moved outside the hook
export const connectWebSocket = (setSocieties: (societies: Society[]) => void, ws: React.MutableRefObject<WebSocket | null>) => {
    const socketUrl = import.meta.env.VITE_WEBSOCKET_URL;
    ws.current = new WebSocket(socketUrl);

    ws.current.onopen = handleOpen;
    ws.current.onmessage = (event) => handleMessage(event, setSocieties);
    ws.current.onerror = handleError;
    ws.current.onclose = (event) => handleClose(event, setSocieties, ws);

    const currentWs = ws.current;
    return () => {
        if (currentWs) {
            currentWs.close();
        }
    };
};

export const useFetchPendingSocieties = () => {
    const [societies, setSocieties] = useState<Society[]>([]);
    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        fetchData(setSocieties);
        connectWebSocket(setSocieties, ws);
    }, []);

    return societies;
};
