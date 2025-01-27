import { useState, useEffect } from "react";
import { apiClient, apiPaths } from "../../api";
import { useNavigate } from "react-router-dom";

type Society = { 
    name: string; 
    leader: string; 
    members: string; 
    roles: any;     // change later
    approvedBy: any; // change later
    actions: any;  // change later
}

const SocietyList = () => {
    const navigate = useNavigate();
    const [societies, setSocieties] = useState<Society[]>([]);

    function goBack() {
        navigate(-1);
      }

    useEffect(() => {
        const getdata = async () => {
            try {
                const res = await apiClient.get(apiPaths.USER.SOCIETY);
                console.log("Fetched Societies:", res.data);
                setSocieties(res.data || []);  // should always be an array
            } catch (error) {
                console.error("Error fetching societies:", error);
            }
        };
    getdata();
    }, []); 

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-6">Society List</h1>
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
                            {["Name", "Leader", "Members", "Roles", "Approved By", "Actions"].map((heading) => (
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
                        {societies.length > 0 ? (
                            societies.map((item, index) => (
                                <tr
                                    key={index}
                                    className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                                >
                                    <td className="px-6 py-4 text-sm text-gray-800">{item.name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-800">{item.leader}</td>
                                    <td className="px-6 py-4 text-sm text-gray-800">{item.members}</td>
                                    {/* <td className="px-6 py-4 text-sm text-gray-800">{item.roles || "-"}</td> */}
                                    <td className="px-6 py-4 text-sm text-gray-800">{item.approvedBy || "-"}</td>
                                    {/* <td className="px-6 py-4 text-sm text-gray-800">{item.actions || "-"}</td> */}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="px-6 py-4 text-center text-gray-500 italic"
                                >
                                    No societies found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SocietyList;