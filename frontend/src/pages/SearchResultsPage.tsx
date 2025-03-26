import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Card, 
  CardContent, 
  Typography, 
  CardActionArea, 
  Avatar, 
  Box, 
  useTheme, 
  InputBase, 
  IconButton,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
} from '@mui/material';
import { tokens } from '../theme/theme';
import { FaCalendarAlt, FaSearch } from 'react-icons/fa';
jest.mock('axios')
import axios from 'axios'
const mockedAxios = axios as jest.Mocked<typeof axios>
import useAuthCheck from "../hooks/useAuthCheck";

const SearchResultsPage = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryParam = searchParams.get('q') || '';
  const [query, setQuery] = useState(queryParam);
  const [results, setResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuthCheck();

  useEffect(() => {
    setQuery(queryParam);
  }, [queryParam]);

  useEffect(() => {
    if (!queryParam) return;

    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/search/?q=${encodeURIComponent(queryParam)}`);
        setResults(res.data);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [queryParam]);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      const searchPath = location.pathname.startsWith('/student')
        ? '/student/student-search'
        : '/search';

      navigate(`${searchPath}?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const ResultSection = ({
    title,
    items,
    type
  }: {
    title: string;
    items: any[];
    type: string;
  }) => {
    if (!items.length) return null;

    return (
      <Box mb={4}>
        <Typography 
          variant="h6" 
          sx={{ 
            mb: 2, 
            color: colors.grey[100],
            fontWeight: "bold"
          }}
        >
          {title}
        </Typography>
        <Box display="grid" gap={2}>
          {items.map((item, idx) => {
            const prefix = location.pathname.startsWith('/student') ? '/student' : '';

            const link =
              type === 'society'
                ? `${prefix}/view-society/${item.id}`
                : type === 'event'
                ? `${prefix}/event/${item.id}`
                : `${prefix}/profile/${item.id}`;

            const primaryText =
              type === 'student'
                ? `${item.first_name} ${item.last_name}`
                : item.title || item.name;

            const secondaryText =
              type === 'student'
                ? `@${item.username}`
                : type === 'event'
                ? item.date
                : '';

            const avatarSrc = item.icon || undefined;

            const getAvatarColor = () => {
              if (type === 'event') return colors.greenAccent[500];
              if (type === 'society') return colors.blueAccent[500];
              return colors.primary[400];
            };

            return (
              <Card 
                key={idx} 
                variant="outlined"
                sx={{ 
                  backgroundColor: colors.primary[400],
                  color: colors.grey[100],
                  borderColor: 'transparent',
                  '&:hover': {
                    boxShadow: `0px 0px 10px ${colors.primary[300]}`,
                    borderColor: colors.blueAccent[400]
                  }
                }}
              >
                <CardActionArea component={Link} to={link}>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {type === 'event' ? (
                      <Avatar sx={{ bgcolor: getAvatarColor(), width: 48, height: 48 }}>
                        <FaCalendarAlt />
                      </Avatar>
                    ) : (
                      <Avatar 
                        src={avatarSrc} 
                        sx={{ 
                          width: 48, 
                          height: 48,
                          bgcolor: getAvatarColor(),
                          color: '#fff'
                        }} 
                      />
                    )}
                    <Box>
                      <Typography 
                        variant="subtitle1" 
                        fontWeight="bold"
                        sx={{ color: colors.grey[100] }}
                      >
                        {primaryText}
                      </Typography>
                      {secondaryText && (
                        <Typography 
                          variant="body2" 
                          sx={{ color: colors.grey[300] }}
                        >
                          {secondaryText}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            );
          })}
        </Box>
      </Box>
    );
  };

  const NoResult = ({ label }: { label: string }) => (
    <Typography 
      variant="body1" 
      sx={{ 
        color: colors.grey[400],
        textAlign: 'center',
        mt: 4
      }}
    >
      No {label} Found.
    </Typography>
  );

  const UserSection = ({users, isAuthenticated}: {users: any[]; isAuthenticated: boolean;}) => {
    if (!users.length) return null;

    return (
      <>
        {!isAuthenticated ? (
          <Typography
            variant="body2"
            sx={{
              color: colors.grey[100],
              mb: 3,
              fontSize: "14px",
              textAlign: "center"
            }}
          >
            Please{" "}
            <Link to="/login" style={{ textDecoration: "underline", color: colors.blueAccent[400] }}>
              login
            </Link>{" "}
            to view user profiles (don't have an account? click{" "}
            <Link to="/register" style={{ textDecoration: "underline", color: colors.blueAccent[400] }}>
              here
            </Link>
            )
          </Typography>
        ) : (
          <ResultSection title="Users" items={users} type="student" />
        )}
      </>
    );
  };

  const renderTabContent = () => {
    if (!results) return null;

    const hasUsers = results.students.length > 0;
    const hasEvents = results.events.length > 0;
    const hasSocieties = results.societies.length > 0;

    switch (activeTab) {
      case 'all':
        return (
          <>
            {hasSocieties && (
              <ResultSection title="Societies" items={results.societies} type="society" />
            )}

            {hasEvents && (
              <ResultSection title="Events" items={results.events} type="event" />
            )}

            {hasUsers && (
              <UserSection users={results.students} isAuthenticated={!!isAuthenticated} />
            )}

            {!hasUsers && !hasEvents && !hasSocieties && (
              <Typography 
                variant="body1" 
                sx={{ 
                  color: colors.grey[400],
                  textAlign: 'center',
                  mt: 4
                }}
              >
                No results found.
              </Typography>
            )}
          </>
        );

      case 'societies':
        return hasSocieties ? (
          <ResultSection title="Societies" items={results.societies} type="society" />
        ) : (
          <NoResult label="Society" />
        );

      case 'events':
        return hasEvents ? (
          <ResultSection title="Events" items={results.events} type="event" />
        ) : (
          <NoResult label="Event" />
        );

      case 'users':
        return hasUsers ? (
          <UserSection users={results.students} isAuthenticated={!!isAuthenticated} />
        ) : (
          <NoResult label="User" />
        );

      default:
        return null;
    }
  };

  return (
    <Box 
      sx={{ 
        p: 3, 
        maxWidth: '900px', 
        mx: 'auto',
        color: colors.grey[100]
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 2,
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          backgroundColor: colors.primary[400],
          border: `1px solid ${colors.primary[300]}`,
        }}
      >
        <InputBase
          placeholder="Search..."
          fullWidth
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleSearch}
          sx={{
            p: 1,
            pl: 2,
            color: colors.grey[100],
            flex: 1,
            backgroundColor: colors.primary[500],
            borderRadius: 1
          }}
        />
        <IconButton
          onClick={() => {
            if (query.trim()) {
              const searchPath = location.pathname.startsWith('/student')
                ? '/student/student-search'
                : '/search';
              navigate(`${searchPath}?q=${encodeURIComponent(query.trim())}`);
            }
          }}
          sx={{
            backgroundColor: colors.blueAccent[500],
            color: '#fff',
            '&:hover': {
              backgroundColor: colors.blueAccent[600],
            },
            p: 1
          }}
        >
          <FaSearch />
        </IconButton>
      </Paper>

      {/* Tabs */}
      <Box mb={3}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
          textColor="inherit"
          TabIndicatorProps={{
            style: { backgroundColor: colors.blueAccent[500] }
          }}
          sx={{
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
          }}
        >
          <Tab value="all" label="All Results" />
          <Tab value="societies" label="Societies" />
          <Tab value="events" label="Events" />
          <Tab value="users" label="Users" />
        </Tabs>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress color="secondary" />
        </Box>
      ) : (
        renderTabContent()
      )}
    </Box>
  );
};

export default SearchResultsPage;