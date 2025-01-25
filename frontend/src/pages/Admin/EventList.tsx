import { useEffect, useState } from "react";
import { apiClient, apiPaths } from "../../api";

type Event = { 
    id: number; 
    title: string; 
    description: string; 
    date: string; 
    startTime: string; 
    duration: string; 
    hostedBy: number; 
    location: string; 
}

const EventList = () => {
    const [events, setEvents] = useState<Event[]>([]);
    useEffect(() => {

    const getdata = async () => {
        const res = await apiClient.get(apiPaths.USER.EVENTS);
        console.log(res);
        setEvents(res.data);
    };
    getdata();
    },[]);

    return (<div>
        <table>
            <tr>
                <th>
                    id</th>
                <th>title</th>
                <th>description</th>
                <th>date</th>
                <th>startTime</th>
                <th>duration</th>
                <th>hostedBy</th>
                <th>location</th>
            </tr>

            {events.map((item, index) => {
                return (
                    <tr key={index}>
                    <td>{item.id}</td>
                    <td>{item.title}</td>
                    <td>{item.description}</td>
                    <td>{item.date}</td>
                    <td>{item.startTime}</td>
                    <td>{item.duration}</td>
                    <td>{item.hostedBy}</td>
                    <td>{item.location}</td>
                    </tr>
                )
            })}

            </table> </div>)
} 

export default EventList;