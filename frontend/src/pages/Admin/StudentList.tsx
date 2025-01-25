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

function StudentList() {
    const [students, setStudents] = useState<Student[]>([]);

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
    <div>
        <table>
            <thead>
            <tr>
                <th>
                    ID</th>
                <th>Username</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Email</th>
                <th>Active</th>
                <th>Role</th>
                <th>Major</th>
                <th>Societies</th>
                <th>President Of</th>
                <th>Is President</th>
            </tr>
            </thead>
            <tbody>
                {students?.length > 0 ? (
                    students?.map((item, index) => (
                        <tr key={index}>
                            <td>{item.id}</td>
                            <td>{item.username}</td>
                            <td>{item.firstName}</td>
                            <td>{item.lastName}</td>
                            <td>{item.email}</td>
                            <td>{item.isActive ? "Yes" : "No"}</td>
                            <td>{item.role}</td>
                            <td>{item.major}</td>
                            <td>{item.societies.join(", ")}</td>
                            <td>{item.presidentOf.join(", ")}</td>
                            <td>{item.isPresident ? "Yes" : "No"}</td>
                        </tr>
                    ))
                    ) : (
                    <tr>
                        <td colSpan={11}>No students found.</td>
                    </tr>
                    )}
            </tbody>
        </table>
    </div>
  )
}

export default StudentList