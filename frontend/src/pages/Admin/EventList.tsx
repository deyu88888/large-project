import { useEffect, useState } from "react";
import { apiClient, apiPaths } from "../../api";
import { useNavigate } from "react-router-dom";

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
    const navigate = useNavigate();
    const [events, setEvents] = useState<Event[]>([]);

    function goBack() {
        navigate(-1);
      }

    useEffect(() => {
    const getdata = async () => {
        const res = await apiClient.get(apiPaths.USER.EVENTS);
        console.log(res);
        setEvents(res.data);
    };
    getdata();
    },[]);

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Event List</h1>
            <button
            className="group px-6 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition-all shadow-sm hover:shadow-md"
            onClick={goBack}
            >
            <span className="inline-flex items-center">
                <span className="mr-2 group-hover:-translate-x-1 transition-transform duration-200">←</span>
                Back
            </span>
            </button>
        </div>
          <div className="overflow-x-auto shadow-lg rounded-lg">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    "ID",
                    "Title",
                    "Description",
                    "Date",
                    "Start Time",
                    "Duration",
                    "Hosted By",
                    "Location",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {events.length > 0 ? (
                  events.map((event, index) => (
                    <tr
                      key={index}
                      className={`${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      <td className="px-6 py-4 text-sm text-gray-800">
                        {event.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800">
                        {event.title}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800">
                        {event.description}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800">
                        {event.date}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800">
                        {event.startTime}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800">
                        {event.duration}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800">
                        {event.hostedBy}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800">
                        {event.location}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-4 text-center text-gray-500 italic"
                    >
                      No events available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    };
    
    export default EventList;