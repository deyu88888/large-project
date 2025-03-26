import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useContext, useCallback, useMemo } from 'react';
import { Box, Button, Typography, useTheme, Alert } from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { tokens } from "../../theme/theme";
import { SearchContext } from "../../components/layout/SearchContext";
import { useSettingsStore } from "../../stores/settings-store";
import { apiClient } from "../../api";
import { useNavigate } from 'react-router-dom';
const filterReportsBySearchTerm = (reports, searchTerm) => {
    if (!searchTerm)
        return reports;
    const normalizedSearchTerm = searchTerm.toLowerCase();
    return reports.filter((report) => Object.values(report)
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearchTerm));
};
const formatDateString = (dateStr) => {
    try {
        return new Date(dateStr).toLocaleString();
    }
    catch (e) {
        return "Invalid date";
    }
};
const truncateText = (text, maxLength) => {
    if (!text)
        return '';
    return text.length > maxLength ? `${text.substring(0, maxLength - 3)}...` : text;
};
const fetchReportReplies = async () => {
    const response = await apiClient.get("/api/admin/reports-replied");
    return response.data || [];
};
const CustomNoRowsOverlay = ({ loading }) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    return (_jsx(Box, { display: "flex", alignItems: "center", justifyContent: "center", height: "100%", children: _jsx(Typography, { variant: "h6", color: colors.grey[100], children: loading ? "Loading reports..." : "No reports with replies found" }) }));
};
const ErrorAlert = ({ message }) => {
    return (_jsx(Alert, { severity: "error", sx: { mb: 2 }, children: message }));
};
const FullPageErrorAlert = ({ message }) => {
    return (_jsx(Box, { p: 2, display: "flex", justifyContent: "center", children: _jsx(Alert, { severity: "error", children: message }) }));
};
const ActionButton = ({ reportId, onClick }) => {
    return (_jsx(Button, { variant: "contained", color: "primary", onClick: () => onClick(reportId), size: "small", children: "View Thread" }));
};
const DataGridContainer = ({ reports, columns, loading, colors }) => {
    return (_jsx(Box, { sx: {
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
        }, children: _jsx(DataGrid, { rows: reports, columns: columns, slots: { toolbar: GridToolbar }, resizeThrottleMs: 0, autoHeight: true, loading: loading, disableRowSelectionOnClick: true, initialState: {
                pagination: { paginationModel: { pageSize: 100 } },
            } }) }));
};
const createReportColumns = (handleViewThread) => {
    return [
        { field: "id", headerName: "ID", flex: 0.5 },
        { field: "from_student_username", headerName: "Reporter", flex: 1 },
        { field: "report_type", headerName: "Report Type", flex: 1 },
        { field: "subject", headerName: "Subject", flex: 1.5 },
        {
            field: "latest_reply",
            headerName: "Latest Reply",
            flex: 2,
        },
        { field: "reply_count", headerName: "Total Replies", flex: 0.8 },
        {
            field: "latest_reply_date",
            headerName: "Latest Reply Date",
            flex: 1.5,
            valueFormatter: (params) => formatDateString(params.value),
        },
        {
            field: "action",
            headerName: "Actions",
            flex: 1,
            sortable: false,
            filterable: false,
            minWidth: 140,
            width: 140,
            renderCell: (params) => (_jsx(ActionButton, { reportId: params.row.id, onClick: handleViewThread })),
        }
    ];
};
const ReportRepliedList = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const navigate = useNavigate();
    const { searchTerm } = useContext(SearchContext);
    const { drawer } = useSettingsStore();
    const [reportState, setReportState] = useState({
        items: [],
        loading: true,
        error: null
    });
    const handleViewThread = useCallback((reportId) => {
        navigate(`/admin/report-thread/${reportId}`);
    }, [navigate]);
    const loadReportReplies = useCallback(async () => {
        setReportState(prev => ({ ...prev, loading: true }));
        try {
            const data = await fetchReportReplies();
            setReportState({
                items: data,
                loading: false,
                error: null
            });
        }
        catch (err) {
            console.error("Error fetching reports with replies:", err);
            setReportState({
                items: [],
                loading: false,
                error: "Failed to fetch reports with replies. Please try again."
            });
        }
    }, []);
    useEffect(() => {
        loadReportReplies();
    }, [loadReportReplies]);
    const filteredReports = useMemo(() => filterReportsBySearchTerm(reportState.items, searchTerm || ''), [reportState.items, searchTerm]);
    const columns = useMemo(() => createReportColumns(handleViewThread), [handleViewThread]);
    if (reportState.error && !reportState.items.length) {
        return _jsx(FullPageErrorAlert, { message: reportState.error });
    }
    return (_jsxs(Box, { sx: {
            height: "calc(100vh - 64px)",
            maxWidth: drawer ? `calc(100% - 3px)` : "100%",
        }, children: [reportState.error && _jsx(ErrorAlert, { message: reportState.error }), _jsx(DataGridContainer, { reports: filteredReports, columns: columns, loading: reportState.loading, colors: colors })] }));
};
export default ReportRepliedList;
