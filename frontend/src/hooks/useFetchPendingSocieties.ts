import { useEffect, useRef, useState } from "react";
import { Society } from "../types";
import { fetchPendingSocieties } from "../pages/Admin/fetchPendingSocieties";

export const fetchData = async (setSocieties: (societies: Society[]) => void) => {
    const societies = await fetchPendingSocieties();
    setSocieties(societies);
    console.log("fetchData executed successfully, societies updated.");
};

export const connectWebSocket = (setSocieties: (societies: Society[]) => void, ws: React.MutableRefObject<WebSocket | null>) => {
    const socketUrl = import.meta.env.VITE_WEBSOCKET_URL;
    ws.current = new WebSocket(socketUrl);

    ws.current.onopen = () => {
        console.log("WebSocket Connected for Pending Society Requests");
    };

    ws.current.onmessage = async (event) => {
        try {
            const data = JSON.parse(event.data);
            console.log("WebSocket Update Received:", data);
            await fetchData(setSocieties);
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
            connectWebSocket(setSocieties, ws);
        }, 5000);
    };
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
