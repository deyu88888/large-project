import { useState, useEffect } from "react";
import { apiClient, apiPaths } from "../../api";

type Society = { 
    name: string; 
    leader: string; 
    members: string; 
    roles: any;     // change later
    approvedBy: any; // change later
    actions: any;  // change later
}

const SocietyList = () => {
    const [societies, setSocieties] = useState<Society[]>([]);

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

    return (<div>
        <table>
            <thead>
            <tr>
                <th>
                    Name</th>
                <th>Leader</th>
                <th>Members</th>
                <th>roles</th>
                <th>approved by</th>
                <th>actions</th>
            </tr>
            </thead>
            <tbody>
                 {societies.length > 0 ? (
                    societies.map((item, index) => (
                        <tr key={index}>
                            <td>{item.name}</td>
                            <td>{item.leader}</td>
                            <td>{item.societyMembers}</td>
                            {/* <td>{item.roles}</td> */}
                            <td>{item.approvedBy}</td>
                            {/* <td>{item.actions}</td> */}
                        </tr>
                    ))
                    ) : (
                    <tr>
                        <td colSpan={6}>No societies found.</td>
                    </tr>
                    )}
        </tbody>
            </table> 
            </div>)
}; 

export default SocietyList;