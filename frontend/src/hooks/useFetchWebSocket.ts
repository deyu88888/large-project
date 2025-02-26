import { useEffect, useRef, useState } from "react";

export const fetchData = async <T>(setData: (data: T[]) => void, fetchDataFunction: () => Promise<T[]>):Promise<void> => {
    const data = await fetchDataFunction();
    setData(data);
    console.log("fetchData executed successfully, data updated."); // TODO: remove all the console logs before deploying
};

export const handleMessage = async <T>(setData: (data: T[]) => void, fetchDataFunction: () => Promise<T[]>):Promise<void> => {
    try {
        await fetchData(setData, fetchDataFunction);
    } catch (error) {
        console.error("Error parsing WebSocket message:", error);   // TODO: keep this, need to know the error
    }
};

export const handleError = (event: Event) => {
    console.error("WebSocket Error:", event);
};

export const handleClose =  <T> (setData: (data: T[]) => void, ws: React.MutableRefObject<WebSocket | null>,  fetchDataFunction: () => Promise<T[]>):void => {
    setTimeout(() => {  
        connectWebSocket(setData, ws, fetchDataFunction);
    }, 5000);
};

export const connectWebSocket =  <T> (setData: (data: T[]) => void, ws: React.MutableRefObject<WebSocket | null>,  fetchDataFunction: () => Promise<T[]>, sourceURL: string) => {
    const socketUrl = `${import.meta.env.VITE_WEBSOCKET_ADMIN_BASE_URL}/${sourceURL}/`;
    ws.current = new WebSocket(socketUrl);

    // ws.current.onopen = handleOpen;
    ws.current.onmessage = () => handleMessage(setData, fetchDataFunction);
    ws.current.onerror = handleError;
    ws.current.onclose = () => handleClose(setData, ws, fetchDataFunction);

    const currentWs = ws.current;
    return () => {
        if (currentWs) {
            currentWs.close();
            ws.current = null;
        }
    };
};

export const useFetchWebSocket = <T> (fetchDataFunction: () => Promise<T[]>, sourceURL: string) => {
    const [data, setData] = useState<T[]>([]);
    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        fetchData(setData, fetchDataFunction);
        connectWebSocket(setData, ws, fetchDataFunction, sourceURL);
    }, []);

    return data;
};