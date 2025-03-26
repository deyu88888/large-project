import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState, useContext, useCallback, useMemo } from 'react';
import { Box, Button, Typography, useTheme, Alert, Chip, CircularProgress } from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { tokens } from "../../theme/theme";
import { SearchContext } from "../../components/layout/SearchContext";
import { useSettingsStore } from "../../stores/settings-store";
import { fetchReportsWithReplies } from './fetchReports';
import { useNavigate } from 'react-router-dom';
const REFRESH_INTERVAL = 5 * 60 * 1000;
const formatDateToLocale = (dateString) => {
    try {
        return new Date(dateString).toLocaleString();
    }
    catch (error) {
        return "Invalid date";
    }
};
const filterReportsBySearchTerm = (reports, searchTerm) => {
    if (!searchTerm)
        return reports;
    const normalizedSearchTerm = searchTerm.toLowerCase();
    return reports.filter((report) => Object.values(report)
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearchTerm));
};
const LatestReplyCell = ({ repliedBy, content }) => {
    return (_jsxs(Box, { children: [_jsxs(Typography, { variant: "body2", sx: { fontWeight: 'bold' }, children: [repliedBy, ":"] }), _jsx(Typography, { variant: "body2", noWrap: true, title: content, children: content })] }));
};
const StatusCell = () => {
    return (_jsx(Chip, { label: "NEEDS REPLY", color: "error", size: "small", sx: { fontWeight: 'bold' } }));
};
const DateCell = ({ dateString, formatter }) => {
    return (_jsx(Typography, { variant: "body2", children: formatter(dateString) }));
};
const ActionButtons = ({ reportId, onViewThread, onReply }) => {
    return (_jsxs(Box, { sx: { display: 'flex', gap: '8px' }, children: [_jsx(Button, { variant: "contained", color: "primary", onClick: () => onViewThread(reportId), size: "small", children: "View Thread" }), _jsx(Button, { variant: "contained", color: "error", onClick: () => onReply(reportId), size: "small", children: "Reply" })] }));
};
const ErrorAlert = ({ message, onClose }) => {
    return (_jsx(Alert, { severity: "error", sx: { marginBottom: "1rem" }, onClose: onClose, children: message }));
};
const LoadingState = ({ message }) => {
    return (_jsxs(Box, { sx: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }, children: [_jsx(CircularProgress, {}), _jsx(Typography, { sx: { ml: 2 }, children: message })] }));
};
const DataGridContainer = ({ reports, columns, loading, colors, drawer }) => {
    return (_jsx(Box, { sx: {
            height: "calc(100vh - 64px)",
            maxWidth: drawer ? `calc(100% - 3px)` : "100%",
        }, children: _jsx(Box, { sx: {
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
                } }) }) }));
};
const createReportColumns = (handleViewThread, handleReply, formatDate) => {
    return [
        { field: "id", headerName: "ID", flex: 0.5 },
        { field: "subject", headerName: "Subject", flex: 1.5 },
        { field: "from_student_name", headerName: "From", flex: 1 },
        {
            field: "latest_reply_content",
            headerName: "Latest Reply",
            flex: 2,
            renderCell: (params) => (_jsx(LatestReplyCell, { repliedBy: params.row.latest_reply.replied_by, content: params.row.latest_reply.content }))
        },
        {
            field: "status",
            headerName: "Status",
            flex: 0.8,
            renderCell: () => _jsx(StatusCell, {})
        },
        {
            field: "latest_reply_date",
            headerName: "Latest Reply Date",
            flex: 1.2,
            renderCell: (params) => (_jsx(DateCell, { dateString: params.row.latest_reply.created_at, formatter: formatDate }))
        },
        {
            field: "requested_at",
            headerName: "Report Date",
            flex: 1.2,
            renderCell: (params) => (_jsx(DateCell, { dateString: params.row.requested_at, formatter: formatDate }))
        },
        {
            field: "actions",
            headerName: "Actions",
            flex: 1,
            renderCell: (params) => (_jsx(ActionButtons, { reportId: params.row.id, onViewThread: handleViewThread, onReply: handleReply }))
        }
    ];
};
const loadReportData = async () => {
    return await fetchReportsWithReplies();
};
const ReportRepliesList = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const { searchTerm } = useContext(SearchContext);
    const { drawer } = useSettingsStore();
    const navigate = useNavigate();
    const [reportState, setReportState] = useState({
        items: [],
        loading: true,
        error: null
    });
    const handleViewThread = useCallback((reportId) => {
        navigate(`/admin/report-thread/${reportId}`);
    }, [navigate]);
    const handleReply = useCallback((reportId) => {
        navigate(`/admin/report-list/${reportId}/reply`);
    }, [navigate]);
    const handleClearError = useCallback(() => {
        setReportState(prev => ({ ...prev, error: null }));
    }, []);
    const fetchReports = useCallback(async () => {
        setReportState(prev => ({ ...prev, loading: true }));
        try {
            const data = await loadReportData();
            setReportState({
                items: data,
                loading: false,
                error: null
            });
        }
        catch (error) {
            console.error("Error fetching reports:", error);
            setReportState(prev => ({
                ...prev,
                error: "Failed to fetch reports with replies.",
                loading: false
            }));
        }
    }, []);
    useEffect(() => {
        fetchReports();
        const intervalId = setInterval(fetchReports, REFRESH_INTERVAL);
        return () => clearInterval(intervalId);
    }, [fetchReports]);
    const formatDate = useCallback(formatDateToLocale, []);
    const filteredReports = useMemo(() => filterReportsBySearchTerm(reportState.items, searchTerm || ''), [reportState.items, searchTerm]);
    const columns = useMemo(() => createReportColumns(handleViewThread, handleReply, formatDate), [handleViewThread, handleReply, formatDate]);
    if (reportState.loading && reportState.items.length === 0) {
        return _jsx(LoadingState, { message: "Loading reports..." });
    }
    return (_jsxs(_Fragment, { children: [reportState.error && (_jsx(ErrorAlert, { message: reportState.error, onClose: handleClearError })), _jsx(DataGridContainer, { reports: filteredReports, columns: columns, loading: reportState.loading, colors: colors, drawer: drawer })] }));
};
export default ReportRepliesList;
