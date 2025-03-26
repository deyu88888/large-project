import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState, useContext, useCallback } from 'react';
import { Box, Button, useTheme } from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { tokens } from "../../theme/theme";
import { SearchContext } from "../../components/layout/SearchContext";
import { useSettingsStore } from "../../stores/settings-store";
import { fetchReports } from './fetchReports';
import { useNavigate } from 'react-router-dom';
const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
};
const createMailtoUrl = (email, subject) => {
    const emailSubject = encodeURIComponent(`Response to your report: "${subject}"`);
    const emailBody = encodeURIComponent("Hi,\n\nRegarding your report, we would like to get in touch with you.\n\nKind regards,\nAdmin Team");
    return `mailto:${email}?subject=${emailSubject}&body=${emailBody}`;
};
const ActionButton = ({ reportId, isPublic, email, subject, onReply }) => {
    if (isPublic && email) {
        return (_jsx(Button, { variant: "contained", color: "secondary", href: createMailtoUrl(email, subject), children: "Email Reply" }));
    }
    return (_jsx(Button, { variant: "contained", color: "primary", onClick: () => onReply(reportId), children: "Reply" }));
};
const DataGridContainer = ({ filteredReports, columns, loading, colors }) => {
    const getDataGridStyles = () => ({
        height: "78vh",
        "& .MuiDataGrid-root": { border: "none" },
        "& .MuiDataGrid-cell": { borderBottom: "none" },
        "& .MuiDataGrid-columnHeaders": {
            backgroundColor: colors.blueAccent[700],
            borderBottom: "none",
        },
        "& .MuiDataGrid-columnHeader": {
            whiteSpace: "normal",
            wordBreak: "break-word",
        },
        "& .MuiDataGrid-virtualScroller": {
            backgroundColor: colors.primary[400],
        },
        "& .MuiDataGrid-footerContainer": {
            borderTop: "none",
            backgroundColor: colors.blueAccent[700],
        },
        "& .MuiCheckbox-root": {
            color: `${colors.blueAccent[400]} !important`,
        },
        "& .MuiDataGrid-toolbarContainer .MuiButton-text": {
            color: `${colors.blueAccent[500]} !important`,
        },
    });
    return (_jsx(Box, { sx: getDataGridStyles(), children: _jsx(DataGrid, { rows: filteredReports, columns: columns, slots: { toolbar: GridToolbar }, getRowId: (row) => row.id, resizeThrottleMs: 0, loading: loading, autoHeight: true }) }));
};
const EmailCell = ({ email }) => {
    if (!email)
        return _jsx(_Fragment, { children: "-" });
    return (_jsx("a", { href: `mailto:${email}`, children: email }));
};
const ReporterCell = ({ reporter }) => {
    return _jsx(_Fragment, { children: reporter || "Public User" });
};
const DateCell = ({ date }) => {
    return _jsx(_Fragment, { children: formatDate(date) });
};
/**
 * AdminReportList component displays a list of reports with filtering and reply actions
 */
const AdminReportList = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const navigate = useNavigate();
    const { searchTerm } = useContext(SearchContext);
    const { drawer } = useSettingsStore();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const loadReports = useCallback(async () => {
        try {
            setLoading(true);
            const data = await fetchReports();
            setReports(data);
            setError(null);
        }
        catch (error) {
            console.error("Failed to fetch reports:", error);
            setError("Failed to fetch reports. Please try again later.");
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        loadReports();
    }, [loadReports]);
    const getFilteredReports = useCallback(() => {
        return reports.filter((report) => Object.values(report)
            .join(" ")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()));
    }, [reports, searchTerm]);
    const handleReplyClick = useCallback((reportId) => {
        navigate(`/admin/report-list/${reportId}/reply`);
    }, [navigate]);
    const getColumns = useCallback(() => [
        { field: "id", headerName: "ID", flex: 0.5 },
        {
            field: "from_student",
            headerName: "Reporter",
            flex: 1,
            renderCell: (params) => (_jsx(ReporterCell, { reporter: params.row.from_student })),
        },
        {
            field: "email",
            headerName: "Email",
            flex: 1,
            renderCell: (params) => (_jsx(EmailCell, { email: params.row.email })),
        },
        { field: "report_type", headerName: "Report Type", flex: 1 },
        { field: "subject", headerName: "Subject", flex: 1.5 },
        { field: "details", headerName: "Details", flex: 2 },
        {
            field: "requested_at",
            headerName: "Requested At",
            flex: 1.5,
            renderCell: (params) => (_jsx(DateCell, { date: params.row.created_at })),
        },
        {
            field: "action",
            headerName: "Actions",
            flex: 1,
            renderCell: (params) => (_jsx(ActionButton, { reportId: params.row.id, isPublic: !params.row.from_student, email: params.row.email, subject: params.row.subject, onReply: handleReplyClick })),
        }
    ], [handleReplyClick]);
    const getContainerStyles = useCallback(() => ({
        height: "calc(100vh - 64px)",
        maxWidth: drawer ? `calc(100% - 3px)` : "100%",
    }), [drawer]);
    const filteredReports = getFilteredReports();
    const columns = getColumns();
    return (_jsx(Box, { sx: getContainerStyles(), children: _jsx(DataGridContainer, { filteredReports: filteredReports, columns: columns, loading: loading, colors: colors }) }));
};
export default AdminReportList;
