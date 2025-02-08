import { useState, useEffect } from "react";
import { apiClient, apiPaths } from "../../api";

type Society = { 
    id: number;
    name: string; 
    leader: string; 
    members: string[]; 
    roles: Record<string, string>;  
    approvedBy: string; 
    actions: string;
};

const SocietyList = () => {
    const [societies, setSocieties] = useState<Society[]>([]);
    const [socket, setSocket] = useState<WebSocket | null>(null);

    useEffect(() => {
        const fetchSocieties = async () => {
            try {
                const res = await apiClient.get(apiPaths.USER.REJECTEDSOCIETY);
                console.log("Fetched Societies:", res.data);
                setSocieties(Array.isArray(res.data) ? res.data : []);
            } catch (error) {
                console.error("⚠️ Error fetching societies:", error);
            }
        };

        fetchSocieties();

        // WebSocket Setup
        const ws = new WebSocket("ws://127.0.0.1:8000/ws/admin/society/");

        ws.onopen = () => {
            console.log("WebSocket Connected for Society List");
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log("WebSocket Update Received:", data.data);

                if (data.data) {
                    setSocieties((prevSocieties) => {
                        const existingIds = new Set(prevSocieties.map((society) => society.id));
                        return existingIds.has(data.data.id) ? prevSocieties : [...prevSocieties, data.data];
                        // }
                    });
                } else {
                    console.warn("WebSocket message has invalid format:", data);
                }
            } catch (error) {
                console.error("Error parsing WebSocket message:", error);
            }
        };

        ws.onerror = (event) => {
            console.error("WebSocket Error:", event);
        };

        ws.onclose = (event) => {
            console.log("WebSocket Disconnected:", event.reason);
            setTimeout(() => {
                setSocket(new WebSocket("ws://127.0.0.1:8000/ws/admin/society/"));
            }, 5000);
        };

        setSocket(ws);

        return () => {
            ws.close();
        };
    }, []);

    return (
        <div>
            <h2>Society List</h2>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Leader</th>
                    </tr>
                </thead>
                <tbody>
                    {societies.length > 0 ? (
                        societies.map((item) => (
                            <tr key={item.id}>
                                <td>{item.name}</td>
                                <td>{item.leader}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={6}>No societies found.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default SocietyList;