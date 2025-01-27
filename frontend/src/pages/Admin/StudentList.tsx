import { useState, useEffect } from "react"

interface Student {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    isActive: boolean;
    role: string;
    major: string;
    societies: any[];
    presidentOf: number[];
    isPresident: boolean;
}

import { apiClient, apiPaths } from "../../api";
import { useNavigate } from "react-router-dom";

function StudentList() {
    const navigate = useNavigate();
    const [students, setStudents] = useState<Student[]>([]);

    function goBack() {
        navigate(-1);
      }

    useEffect(() => {
        const getdata = async () => {
            try {
                const res = await apiClient.get(apiPaths.USER.STUDENTS);
                console.log("Fetched Students:", res.data);
                setStudents(res.data || []);  // should always be an array
            } catch (error) {
                console.error("Error fetching students:", error);
            }
        };
        getdata();
    }, []);

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
                                "Username",
                                "First Name",
                                "Last Name",
                                "Email",
                                "Active",
                                "Role",
                                "Major",
                                "Societies",
                                "President Of",
                                "Is President",
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
                        {students?.length > 0 ? (
                            students.map((item, index) => (
                                <tr
                                    key={index}
                                    className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                                >
                                    <td className="px-6 py-4 text-sm text-gray-800">{item.id}</td>
                                    <td className="px-6 py-4 text-sm text-gray-800">{item.username}</td>
                                    <td className="px-6 py-4 text-sm text-gray-800">{item.firstName}</td>
                                    <td className="px-6 py-4 text-sm text-gray-800">{item.lastName}</td>
                                    <td className="px-6 py-4 text-sm text-gray-800">{item.email}</td>
                                    <td className="px-6 py-4 text-sm text-gray-800">
                                        {item.isActive ? "Yes" : "No"}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-800">{item.role}</td>
                                    <td className="px-6 py-4 text-sm text-gray-800">{item.major}</td>
                                    <td className="px-6 py-4 text-sm text-gray-800">
                                        {item.societies.join(", ")}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-800">
                                        {item.presidentOf.join(", ")}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-800">
                                        {item.isPresident ? "Yes" : "No"}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan={11}
                                    className="px-6 py-4 text-center text-gray-500 italic"
                                >
                                    No students found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default StudentList;