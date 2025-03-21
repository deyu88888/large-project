import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FaSearch, FaUser, FaCalendarAlt, FaUniversity } from 'react-icons/fa';
import axios from 'axios';

const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryParam = searchParams.get('q') || '';
  const [query, setQuery] = useState(queryParam);
  const [results, setResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(false);

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

  const ResultSection = ({ title, items, type }: { title: string; items: any[]; type: string }) => {
    if (!items.length) return null;
    return (
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">{title}</h2>
        <ul className="space-y-2">
          {items.map((item, idx) => (
            <li key={idx} className="border p-3 rounded">
              {type === 'student' && (
                <p className="flex items-center gap-2">
                  <FaUser className="text-blue-600" />
                  {item.first_name} {item.last_name} (@{item.username})
                </p>
              )}
              {type === 'event' && (
                <p className="flex items-center gap-2">
                  <FaCalendarAlt className="text-green-600" />
                  {item.title} - {item.date}
                </p>
              )}
              {type === 'society' && (
                <p className="flex items-center gap-2">
                  <FaUniversity className="text-purple-600" />
                  {item.name}
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const NoResult = ({ label }: { label: string }) => (
    <p className="text-gray-500">No {label} Found.</p>
  );

  const renderTabContent = () => {
    if (!results) return null;

    const hasUsers = results.students.length > 0;
    const hasEvents = results.events.length > 0;
    const hasSocieties = results.societies.length > 0;

    switch (activeTab) {
      case 'all':
        return (
          <>
            {hasSocieties && <ResultSection title="Societies" items={results.societies} type="society" />}
            {hasEvents && <ResultSection title="Events" items={results.events} type="event" />}
            {hasUsers && <ResultSection title="Users" items={results.students} type="student" />}
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
          <ResultSection title="Users" items={results.students} type="student" />
        ) : (
          <NoResult label="User" />
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      {/* 搜索框 */}
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
                <FaSearch/>
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
