import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { apiClient } from "../api";
import { CircularProgress, Typography, Card, CardContent, Avatar, Box } from "@mui/material";

const StudentDetailPage: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudent = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get(`/api/student/${studentId}`);
        setStudent(response.data);
      } catch (error) {
        console.error("Error fetching student details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      fetchStudent();
    }
  }, [studentId]);

  if (loading) {
    return <CircularProgress sx={{ display: "block", margin: "20px auto" }} />;
  }

  if (!student) {
    return (
      <Typography variant="h6" align="center">
        Student not found.
      </Typography>
    );
  }

  return (
    <Box sx={{ p: 4, maxWidth: "800px", margin: "0 auto" }}>
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center">
            <Avatar
              alt={student.username}
              src={student.icon}
              sx={{ width: 80, height: 80, mr: 2 }}
            />
            <Typography variant="h4">{student.username}</Typography>
          </Box>
          <Typography variant="body1" sx={{ mt: 2 }}>
            Major: {student.major || "N/A"}
          </Typography>
          <Typography variant="body1" sx={{ mt: 1 }}>
            Email: {student.email}
          </Typography>
          <Typography variant="body1" sx={{ mt: 1 }}>
            Role: {student.role}
          </Typography>
          {student.societies && student.societies.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6">Societies</Typography>
              <ul>
                {student.societies.map((society: any) => (
                  <li key={society.id}>
                    <Link to={`/society/${society.id}`}>{society.name}</Link>
                  </li>
                ))}
              </ul>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default StudentDetailPage;
