import React, { useEffect, useState } from 'react';
import { apiClient, apiPaths } from "../../api";

interface Report {
    id: number;
    from_student: string;
    message: string;
    created_at: string;
}

const AdminReport: React.FC = () => {
    const [reports, setReports] = useState<Report[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchReports = async () => {
            try {
              const res = await apiClient.get(apiPaths.USER.REPORT);
              setReports(res.data);
            } catch (error) {
              console.error("Error fetching pending events:", error);
            }
          };
        fetchReports();
    }, []);

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div>
            <h1>Admin Reports</h1>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Reporter</th>
                        <th>Message</th>
                        <th>Created At</th>
                    </tr>
                </thead>
                <tbody>
                    {reports.map(report => (
                        <tr key={report.id}>
                            <td>{report.id}</td>
                            <td>{report.from_student}</td>
                            <td>{report.message}</td>
                            <td>{new Date(report.created_at).toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AdminReport;
