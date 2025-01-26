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
}

const PendingSocietyRequest = () => {
    const [societies, setSocieties] = useState<Society[]>([]);
    useEffect(() => {

    const getdata = async () => {
        const res = await apiClient.get(apiPaths.USER.PENDINGSOCIETYREQUEST);
        // console.log(res);
        setSocieties(res.data);
    };
    getdata();
    },[]);

    const handleAccept = async (id: number) => {
        // return async () => {
            const res = await apiClient.put(apiPaths.USER.PENDINGSOCIETYREQUEST+'/'+id, {status: 'Approved'});
            console.log(res);
            setSocieties(societies.filter((society) => society.id !== id));
        // }
        // console.log(id);
    }
    const handleReject = async (id: number) => {
        // return async () => {
            const res = await apiClient.put(apiPaths.USER.PENDINGSOCIETYREQUEST+'/'+id, {status: 'Rejected'});
            console.log(res);
            setSocieties(societies.filter((society) => society.id !== id));
        // }
        // console.log(id);
    }
    return (<div>
        <table>
            <tr>
                <th>
                    id</th>
                <th>name</th>
                <th>societyMembers</th>
                {/* <th>roles</th> */}
                <th>leader</th>
                <th>category</th>
                {/* <th>socialMediaLinks</th> */}
                <th>timetable</th>
                <th>membershipRequirements</th>
                <th>upcomingProjectsOrPlans</th>
                <th>Accept</th>
                <th>Reject</th>
            </tr>
            {societies.map((item, index) => {
                return (
                    <tr key={index}>
                    <td>{item.id}</td>
                    <td>{item.name}</td>
                    <td>{item.societyMembers}</td>
                    {/* <td>{item.roles}</td> */}
                    <td>{item.leader}</td>
                    <td>{item.category}</td>
                    {/* <td>{item.socialMediaLinks}</td> */}
                    <td>{item.timetable}</td>
                    <td>{item.membershipRequirements}</td>
                    <td>{item.upcomingProjectsOrPlans}</td>
                    <td><button onClick={() => handleAccept(item.id)}>accept</button></td>
                    <td><button onClick={() => handleReject(item.id)}>reject</button></td>
                    {/* <td><button>reject</button></td> */}
                    </tr>
                )
            })}

            </table> </div>)
} 


export default PendingSocietyRequest;