import { useEffect, useState } from "react";
import { apiClient, apiPaths } from "../../api";

type Society = { 
    id: number;
    name: string;
    societyMembers: number[];
    roles: {};
    leader: number;
    category: string;
    socialMediaLinks: {};
    timetable: string | null;
    membershipRequirements:string | null;
    upcomingProjectsOrPlans: string | null;
};

const PendingSocietyRequest = () => {
    const [societies, setSocieties] = useState<Society[]>([]);
    const [socket, setSocket] = useState<WebSocket | null>(null);

    useEffect(() => {
        const fetchSocieties = async () => {
            try {
                const res = await apiClient.get(apiPaths.USER.PENDINGSOCIETYREQUEST);
                console.log("Fetched Societies:", res.data);
                setSocieties(Array.isArray(res.data) ? res.data : []);
            } catch (error) {
                console.error("⚠️ Error fetching societies:", error);
            }
        };

        fetchSocieties();

    //     const socket = new WebSocket("ws://127.0.0.1:8000/ws/admin/society-request/");

    //     socket.onmessage = (event) => {
    //         const data = JSON.parse(event.data);
    //         if (data.pending_requests) {
    //             setSocieties(data.pending_requests);
    //         }
    //     };

    //     socket.onclose = () => {
    //         console.log("WebSocket closed");
    //     };

    //     return () => {
    //         socket.close();
    //     };
    // }, []);
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

    const handleAccept = async (id: number) => {
        const res = await apiClient.put(apiPaths.USER.PENDINGSOCIETYREQUEST + '/' + id, {status: 'Approved'});
        console.log(res);
        setSocieties(societies.filter((society) => society.id !== id));
    };

    const handleReject = async (id: number) => {
        const res = await apiClient.put(apiPaths.USER.PENDINGSOCIETYREQUEST + '/' + id, {status: 'Rejected'});
        console.log(res);
        setSocieties(societies.filter((society) => society.id !== id));
    };

    return (
        <div>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        {/* <th>Society Members</th> */}
                        <th>Leader</th>
                        <th>Category</th>
                        <th>Timetable</th>
                        <th>Membership Requirements</th>
                        <th>Upcoming Projects or Plans</th>
                        <th>Accept</th>
                        <th>Reject</th>
                    </tr>
                </thead>
                <tbody>
                    {societies.map((item, index) => (
                        <tr key={index}>
                            <td>{item.id}</td>
                            <td>{item.name}</td>
                            {/* <td>{item.societyMembers.join(", ")}</td> */}
                            <td>{item.leader}</td>
                            <td>{item.category}</td>
                            <td>{item.timetable}</td>
                            <td>{item.membershipRequirements}</td>
                            <td>{item.upcomingProjectsOrPlans}</td>
                            <td><button onClick={() => handleAccept(item.id)}>Accept</button></td>
                            <td><button onClick={() => handleReject(item.id)}>Reject</button></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default PendingSocietyRequest;
