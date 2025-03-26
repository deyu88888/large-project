import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, Typography, CardActionArea, Avatar, Box, useTheme, InputBase, IconButton, Paper, Tabs, Tab, CircularProgress } from '@mui/material';
import { tokens } from '../theme/theme';
import { FaCalendarAlt, FaSearch } from 'react-icons/fa';
import axios from 'axios';
import useAuthCheck from "../hooks/useAuthCheck";
const SearchResultsPage = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const queryParam = searchParams.get('q') || '';
    const [query, setQuery] = useState(queryParam);
    const [results, setResults] = useState(null);
    const [activeTab, setActiveTab] = useState('all');
    const [loading, setLoading] = useState(false);
    const { isAuthenticated } = useAuthCheck();
    useEffect(() => {
        setQuery(queryParam);
    }, [queryParam]);
    useEffect(() => {
        if (!queryParam)
            return;
        const fetchResults = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`/api/search/?q=${encodeURIComponent(queryParam)}`);
                setResults(res.data);
            }
            catch (err) {
                console.error("Search failed", err);
            }
            finally {
                setLoading(false);
            }
        };
        fetchResults();
    }, [queryParam]);
    const handleSearch = (e) => {
        if (e.key === 'Enter' && query.trim()) {
            const searchPath = location.pathname.startsWith('/student')
                ? '/student/student-search'
                : '/search';
            navigate(`${searchPath}?q=${encodeURIComponent(query.trim())}`);
        }
    };
    const ResultSection = ({ title, items, type }) => {
        if (!items.length)
            return null;
        return (_jsxs(Box, { mb: 4, children: [_jsx(Typography, { variant: "h6", sx: {
                        mb: 2,
                        color: colors.grey[100],
                        fontWeight: "bold"
                    }, children: title }), _jsx(Box, { display: "grid", gap: 2, children: items.map((item, idx) => {
                        const prefix = location.pathname.startsWith('/student') ? '/student' : '';
                        const link = type === 'society'
                            ? `${prefix}/view-society/${item.id}`
                            : type === 'event'
                                ? `${prefix}/event/${item.id}`
                                : `${prefix}/profile/${item.id}`;
                        const primaryText = type === 'student'
                            ? `${item.first_name} ${item.last_name}`
                            : item.title || item.name;
                        const secondaryText = type === 'student'
                            ? `@${item.username}`
                            : type === 'event'
                                ? item.date
                                : '';
                        const avatarSrc = item.icon || undefined;
                        const getAvatarColor = () => {
                            if (type === 'event')
                                return colors.greenAccent[500];
                            if (type === 'society')
                                return colors.blueAccent[500];
                            return colors.primary[400];
                        };
                        return (_jsx(Card, { variant: "outlined", sx: {
                                backgroundColor: colors.primary[400],
                                color: colors.grey[100],
                                borderColor: 'transparent',
                                '&:hover': {
                                    boxShadow: `0px 0px 10px ${colors.primary[300]}`,
                                    borderColor: colors.blueAccent[400]
                                }
                            }, children: _jsx(CardActionArea, { component: Link, to: link, children: _jsxs(CardContent, { sx: { display: 'flex', alignItems: 'center', gap: 2 }, children: [type === 'event' ? (_jsx(Avatar, { sx: { bgcolor: getAvatarColor(), width: 48, height: 48 }, children: _jsx(FaCalendarAlt, {}) })) : (_jsx(Avatar, { src: avatarSrc, sx: {
                                                width: 48,
                                                height: 48,
                                                bgcolor: getAvatarColor(),
                                                color: '#fff'
                                            } })), _jsxs(Box, { children: [_jsx(Typography, { variant: "subtitle1", fontWeight: "bold", sx: { color: colors.grey[100] }, children: primaryText }), secondaryText && (_jsx(Typography, { variant: "body2", sx: { color: colors.grey[300] }, children: secondaryText }))] })] }) }) }, idx));
                    }) })] }));
    };
    const NoResult = ({ label }) => (_jsxs(Typography, { variant: "body1", sx: {
            color: colors.grey[400],
            textAlign: 'center',
            mt: 4
        }, children: ["No ", label, " Found."] }));
    const UserSection = ({ users, isAuthenticated }) => {
        if (!users.length)
            return null;
        return (_jsx(_Fragment, { children: !isAuthenticated ? (_jsxs(Typography, { variant: "body2", sx: {
                    color: colors.grey[100],
                    mb: 3,
                    fontSize: "14px",
                    textAlign: "center"
                }, children: ["Please", " ", _jsx(Link, { to: "/login", style: { textDecoration: "underline", color: colors.blueAccent[400] }, children: "login" }), " ", "to view user profiles (don't have an account? click", " ", _jsx(Link, { to: "/register", style: { textDecoration: "underline", color: colors.blueAccent[400] }, children: "here" }), ")"] })) : (_jsx(ResultSection, { title: "Users", items: users, type: "student" })) }));
    };
    const renderTabContent = () => {
        if (!results)
            return null;
        const hasUsers = results.students.length > 0;
        const hasEvents = results.events.length > 0;
        const hasSocieties = results.societies.length > 0;
        switch (activeTab) {
            case 'all':
                return (_jsxs(_Fragment, { children: [hasSocieties && (_jsx(ResultSection, { title: "Societies", items: results.societies, type: "society" })), hasEvents && (_jsx(ResultSection, { title: "Events", items: results.events, type: "event" })), hasUsers && (_jsx(UserSection, { users: results.students, isAuthenticated: !!isAuthenticated })), !hasUsers && !hasEvents && !hasSocieties && (_jsx(Typography, { variant: "body1", sx: {
                                color: colors.grey[400],
                                textAlign: 'center',
                                mt: 4
                            }, children: "No results found." }))] }));
            case 'societies':
                return hasSocieties ? (_jsx(ResultSection, { title: "Societies", items: results.societies, type: "society" })) : (_jsx(NoResult, { label: "Society" }));
            case 'events':
                return hasEvents ? (_jsx(ResultSection, { title: "Events", items: results.events, type: "event" })) : (_jsx(NoResult, { label: "Event" }));
            case 'users':
                return hasUsers ? (_jsx(UserSection, { users: results.students, isAuthenticated: !!isAuthenticated })) : (_jsx(NoResult, { label: "User" }));
            default:
                return null;
        }
    };
    return (_jsxs(Box, { sx: {
            p: 3,
            maxWidth: '900px',
            mx: 'auto',
            color: colors.grey[100]
        }, children: [_jsxs(Paper, { elevation: 3, sx: {
                    p: 2,
                    mb: 3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    backgroundColor: colors.primary[400],
                    border: `1px solid ${colors.primary[300]}`,
                }, children: [_jsx(InputBase, { placeholder: "Search...", fullWidth: true, value: query, onChange: (e) => setQuery(e.target.value), onKeyDown: handleSearch, sx: {
                            p: 1,
                            pl: 2,
                            color: colors.grey[100],
                            flex: 1,
                            backgroundColor: colors.primary[500],
                            borderRadius: 1
                        } }), _jsx(IconButton, { onClick: () => {
                            if (query.trim()) {
                                const searchPath = location.pathname.startsWith('/student')
                                    ? '/student/student-search'
                                    : '/search';
                                navigate(`${searchPath}?q=${encodeURIComponent(query.trim())}`);
                            }
                        }, sx: {
                            backgroundColor: colors.blueAccent[500],
                            color: '#fff',
                            '&:hover': {
                                backgroundColor: colors.blueAccent[600],
                            },
                            p: 1
                        }, children: _jsx(FaSearch, {}) })] }), _jsx(Box, { mb: 3, children: _jsxs(Tabs, { value: activeTab, onChange: (_, newValue) => setActiveTab(newValue), variant: "fullWidth", textColor: "inherit", TabIndicatorProps: {
                        style: { backgroundColor: colors.blueAccent[500] }
                    }, sx: {
                        '& .MuiTab-root': {
                            color: colors.grey[300],
                            '&.Mui-selected': {
                                color: colors.grey[100],
                                fontWeight: 'bold'
                            }
                        },
                        backgroundColor: colors.primary[400],
                        borderRadius: 1,
                        mb: 2
                    }, children: [_jsx(Tab, { value: "all", label: "All Results" }), _jsx(Tab, { value: "societies", label: "Societies" }), _jsx(Tab, { value: "events", label: "Events" }), _jsx(Tab, { value: "users", label: "Users" })] }) }), loading ? (_jsx(Box, { display: "flex", justifyContent: "center", mt: 4, children: _jsx(CircularProgress, { color: "secondary" }) })) : (renderTabContent())] }));
};
export default SearchResultsPage;
