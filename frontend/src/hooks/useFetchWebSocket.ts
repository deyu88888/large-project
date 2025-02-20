import { useEffect, useRef, useState } from "react";

export const fetchData = async <T>(setData: (data: T[]) => void, fetchDataTest: () => Promise<T[]>):Promise<void> => {
    const data = await fetchDataTest();
    setData(data);
    console.log("fetchData executed successfully, data updated.");
};

// WebSocket event handlers
export const handleOpen = () => {
    console.log("WebSocket Connected for Pending Requests");
};

export const handleMessage = async <T>(event: MessageEvent, setData: (data: T[]) => void, fetchDataTest: () => Promise<T[]>):Promise<void> => {
    try {
        const data = JSON.parse(event.data);    // debugging purposes, should remove at the end
        console.log("WebSocket Update Received:", data);    // debugging purposes, should remove at the end
        await fetchData(setData, fetchDataTest);
    } catch (error) {
        console.error("Error parsing WebSocket message:", error);
    }
};

export const handleError = (event: Event) => {
    console.error("WebSocket Error:", event);
};

export const handleClose =  <T> (event: CloseEvent, setData: (data: T[]) => void, ws: React.MutableRefObject<WebSocket | null>,  fetchDataTest: () => Promise<T[]>):void => {
    console.log("WebSocket Disconnected:", event.reason);
    setTimeout(() => {  
        connectWebSocket(setData, ws, fetchDataTest);
    }, 5000);
};

export const connectWebSocket =  <T> (setData: (data: T[]) => void, ws: React.MutableRefObject<WebSocket | null>,  fetchDataTest: () => Promise<T[]>, sourceURL: string) => {
    const socketUrl = `${import.meta.env.VITE_WEBSOCKET_ADMIN_BASE_URL}/${sourceURL}/`;
    console.log("socketUrl xxx", socketUrl);
    ws.current = new WebSocket(socketUrl);

    ws.current.onopen = handleOpen;
    ws.current.onmessage = (event) => handleMessage(event, setData, fetchDataTest);
    ws.current.onerror = handleError;
    ws.current.onclose = (event) => handleClose(event, setData, ws, fetchDataTest);

    const currentWs = ws.current;
    return () => {
        if (currentWs) {
            currentWs.close();
        }
    };
};

export const useFetchWebSocket = <T> (fetchDataTest: () => Promise<T[]>, sourceURL: string) => {
    const [data, setData] = useState<T[]>([]);
    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        fetchData(setData, fetchDataTest);
        connectWebSocket(setData, ws, fetchDataTest, sourceURL);
    }, []);

    return data;
};