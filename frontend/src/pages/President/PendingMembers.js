import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// TODO: seed first, then refactor 
// TODO: refactor the working version of this page
// TODO: cannot refactor at this stage, as there's no way of knowing if this page works 
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { apiClient } from "../../api";
// interface PendingMember {
//   id: number;
//   first_name: string;
//   last_name: string;
//   username: string;
// }
const PendingMembers = () => {
    const { societyId } = useParams();
    const [pendingMembers, setPendingMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (!societyId) {
            console.error("societyId is missing from URL params");
            setError("Missing society ID parameter");
            setLoading(false);
            return;
        }
        fetchPendingMembers();
    }, [societyId]);
    const fetchPendingMembers = async () => {
        try {
            const response = await apiClient.get(`/api/society/${societyId}/pending-members/`);
            setPendingMembers(response.data);
        }
        catch (error) {
            console.error("Error fetching pending members:", error);
            setError("Failed to load pending members");
        }
        finally {
            setLoading(false);
        }
    };
    const handleApproval = async (memberId, approved) => {
        try {
            const action = approved ? "approve" : "reject";
            await apiClient.post(`/api/society/${societyId}/pending-members/${memberId}/`, { action });
            fetchPendingMembers();
        }
        catch (error) {
            console.error("Error updating member status:", error);
        }
    };
    if (error) {
        return (_jsx("div", { className: "container mx-auto p-8", children: _jsx("div", { className: "bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded", children: _jsx("p", { children: error }) }) }));
    }
    if (loading)
        return _jsx("p", { children: "Loading pending members..." });
    return (_jsxs("div", { className: "container mx-auto p-8", children: [_jsx("h1", { className: "text-3xl font-bold mb-6", children: "Pending Members" }), pendingMembers.length === 0 ? (_jsx("p", { children: "No pending membership requests." })) : (_jsx("ul", { className: "space-y-4", children: pendingMembers.map((member) => (_jsxs("li", { className: "p-4 bg-white shadow rounded flex justify-between", children: [_jsxs("div", { children: [_jsxs("p", { className: "font-medium", children: [member.first_name, " ", member.last_name] }), _jsx("p", { className: "text-sm text-gray-500", children: member.username })] }), _jsxs("div", { children: [_jsx("button", { className: "bg-green-500 text-white px-4 py-2 rounded mr-2 hover:bg-green-600", onClick: () => handleApproval(member.id, true), children: "Accept" }), _jsx("button", { className: "bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600", onClick: () => handleApproval(member.id, false), children: "Reject" })] })] }, member.id))) }))] }));
};
export default PendingMembers;
