import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {Card, CardContent, Typography, CardActionArea, Avatar, Box} from '@mui/material';
import {FaCalendarAlt, FaSearch} from 'react-icons/fa';
import axios from 'axios';

function isUserAuthenticated(): boolean {
  const token = localStorage.getItem("token");
  if (!token) return false;
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return false;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    return payload.exp * 1000 > Date.now();
  } catch (error) {
    console.error("Error decoding token:", error);
    return false;
  }
}

const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryParam = searchParams.get('q') || '';
  const [query, setQuery] = useState(queryParam);
  const [results, setResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(false);
  const [isAuthenticated] = useState<boolean>(isUserAuthenticated());

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
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const ResultSection = ({title, items, type
  }: {
    title: string;
    items: any[];
    type: string;
  }) => {
    if (!items.length) return null;

    return (
      <div className="mb-6">
        <Typography variant="h6" gutterBottom>{title}</Typography>
        <Box display="grid" gap={2}>
          {items.map((item, idx) => {
            const link =
              type === 'society'
                ? `/view-society/${item.id}`
                : type === 'event'
                ? `/event/${item.id}`
                : `/profile/${item.id}`;

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

            return (
              <Card key={idx} variant="outlined">
                <CardActionArea component={Link} to={link}>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {type === 'event' ? (
                      <Avatar sx={{ bgcolor: 'success.main', width: 48, height: 48 }}>
                        <FaCalendarAlt />
                      </Avatar>
                    ) : (
                      <Avatar src={avatarSrc} sx={{ width: 48, height: 48 }} />
                    )}
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">{primaryText}</Typography>
                      {secondaryText && (
                        <Typography variant="body2" color="text.secondary">{secondaryText}</Typography>
                      )}
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            );
          })}
        </Box>
      </div>
    );
  };

  const NoResult = ({ label }: { label: string }) => (
    <p className="text-gray-500">No {label} Found.</p>
  );

  const UserSection = ({users, isAuthenticated
  }: {
    users: any[];
    isAuthenticated: boolean;
  }) => {
    if (!users.length) return null;

    return (
      <>
        <Typography variant="h6" gutterBottom>Users</Typography>
        {!isAuthenticated ? (
          <Typography
            variant="body2"
            color="text.primary"
            marginBottom="20px"
            fontSize="14px"
            align="center"
          >
            Please{" "}
            <Link to="/login" style={{ textDecoration: "underline", color: "blue" }}>
              login
            </Link>{" "}
            to view user profiles (don't have an account? click{" "}
            <Link to="/register" style={{ textDecoration: "underline", color: "blue" }}>
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
              <UserSection users={results.students} isAuthenticated={isAuthenticated} />
            )}

            {!hasUsers && !hasEvents && !hasSocieties && (
              <p className="text-gray-500">No results found.</p>
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
          <UserSection users={results.students} isAuthenticated={isAuthenticated} />
        ) : (
          <NoResult label="User" />
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Search..."
          className="border p-2 flex-1 rounded"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleSearch}
        />
        <button
          onClick={() => query.trim() && navigate(`/search?q=${encodeURIComponent(query.trim())}`)}
          className="bg-blue-600 text-white px-4 py-2 rounded flex items-center justify-center"
        >
          <FaSearch />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {['all', 'societies', 'events', 'users'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            {tab === 'all' ? 'All Results' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {loading ? <p>Loading...</p> : renderTabContent()}
    </div>
  );
};

export default SearchResultsPage;
