import React, { useState, useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../theme/theme";
import { apiClient } from "../../api";
import {
  StyleProps,
  NewsItem,
  PageContainerProps,
  HeaderProps,
  LoadingStateProps,
  EmptyStateProps,
  MarkAsReadButtonProps,
  ReadStatusProps,
  NewsItemProps,
  NewsListProps
} from "../../types/student/ViewNews";

// Component Functions
const PageContainer: React.FC<PageContainerProps> = ({ children, styleProps }) => {
  const { isLight, colours } = styleProps;
  
  return (
    <div
      style={{
        marginLeft: "0px",
        marginTop: "0px",
        transition: "margin-left 0.3s ease-in-out",
        minHeight: "100vh",
        padding: "20px 40px",
        backgroundColor: isLight ? colours.primary[1000] : colours.primary[500],
      }}
    >
      <div style={{ maxWidth: "1920px", margin: "0 auto" }}>
        {children}
      </div>
    </div>
  );
};

const PageHeader: React.FC<HeaderProps> = ({ styleProps }) => {
  const { colours } = styleProps;
  
  return (
    <header
      style={{
        textAlign: "center",
        marginBottom: "2.5rem",
        padding: "2rem 0",
      }}
    >
      <h1
        style={{
          color: colours.grey[100],
          fontSize: "2.25rem",
          fontWeight: 700,
          marginBottom: "0.5rem",
        }}
      >
        All News
      </h1>
      <p
        style={{
          color: colours.grey[300],
          fontSize: "1.125rem",
          margin: 0,
        }}
      >
        Stay informed about the latest news and announcements.
      </p>
    </header>
  );
};

const LoadingState: React.FC<LoadingStateProps> = ({ styleProps }) => {
  const { isLight, colours } = styleProps;
  
  return (
    <p
      style={{
        color: isLight ? colours.grey[700] : colours.grey[300],
        textAlign: "center",
        fontSize: "1.125rem",
      }}
    >
      Loading News...
    </p>
  );
};

const EmptyState: React.FC<EmptyStateProps> = ({ styleProps }) => {
  const { isLight, colours } = styleProps;
  
  return (
    <p
      style={{
        color: isLight ? colours.grey[600] : colours.grey[300],
        textAlign: "center",
        fontSize: "1.125rem",
      }}
    >
      No new News.
    </p>
  );
};

const MarkAsReadButton: React.FC<MarkAsReadButtonProps> = ({ onMarkAsRead, styleProps }) => {
  const { isLight, colours } = styleProps;
  
  return (
    <button
      onClick={onMarkAsRead}
      style={{
        color: isLight ? colours.blueAccent[400] : colours.blueAccent[300],
        fontSize: "0.875rem",
        fontWeight: 500,
        background: "none",
        border: "none",
        cursor: "pointer",
        textDecoration: "underline",
      }}
    >
      Mark as Read
    </button>
  );
};

const ReadStatus: React.FC<ReadStatusProps> = ({ styleProps }) => {
  const { colours } = styleProps;
  
  return (
    <span
      style={{
        color: colours.greenAccent[500],
        fontSize: "0.875rem",
        fontWeight: 500,
      }}
    >
      Read
    </span>
  );
};

const NewsItemComponent: React.FC<NewsItemProps> = ({ item, onMarkAsRead, styleProps }) => {
  const { isLight, colours } = styleProps;
  
  const getBackgroundColor = () => {
    return item.is_read ? colours.primary[400] : colours.blueAccent[700];
  };
  
  const getBorderColor = () => {
    if (item.is_read) {
      return isLight ? colours.grey[300] : colours.grey[700];
    }
    return colours.blueAccent[400];
  };
  
  return (
    <div
      className="p-5 rounded-lg shadow-md hover:shadow-lg transition-all border"
      style={{
        backgroundColor: getBackgroundColor(),
        borderColor: getBorderColor(),
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ color: colours.grey[100] }}>
          <b>{item.title}</b>
          <p>{item.brief}</p>
        </div>
        <div style={{ display: "flex", gap: "1rem" }}>
          {item.is_read ? (
            <ReadStatus styleProps={styleProps} />
          ) : (
            <MarkAsReadButton 
              onMarkAsRead={() => onMarkAsRead(item.id)} 
              styleProps={styleProps} 
            />
          )}
        </div>
      </div>
    </div>
  );
};

const NewsList: React.FC<NewsListProps> = ({ news, onMarkAsRead, styleProps }) => {
  return (
    <div className="space-y-6">
      {news.map((item) => (
        <NewsItemComponent
          key={item.id}
          item={item}
          onMarkAsRead={onMarkAsRead}
          styleProps={styleProps}
        />
      ))}
    </div>
  );
};

// Custom Hooks
const useNews = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const fetchNews = async () => {
    try {
      // This simulates the API call to get news
      const response: NewsItem[] = [
        {
          id: 1,
          title: "News Title",
          brief: "News Brief",
          content: "News",
        },
        {
          id: 2,
          title: "News Title2",
          brief: "News Brief2",
          content: "News2",
        },
        {
          id: 3,
          title: "News Title3",
          brief: "News Brief3",
          content: "News3",
        }
      ];
      
      setNews(response);
    } catch (error) {
      console.error("Error fetching news:", error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchNews();
  }, []);
  
  const markNewsAsRead = async (id: number) => {
    try {
      await apiClient.post(`/api/news/${id}/mark-read`);
      updateNewsReadStatus(id);
    } catch (error) {
      console.error("Failed to mark news as read:", error);
    }
  };
  
  const updateNewsReadStatus = (id: number) => {
    setNews(prevNews =>
      prevNews.map(item =>
        item.id === id ? { ...item, is_read: true } : item
      )
    );
  };
  
  return {
    news,
    loading,
    markNewsAsRead
  };
};

// Main Component
const ViewNews: React.FC = () => {
  const theme = useTheme();
  const colours = tokens(theme.palette.mode);
  const isLight = theme.palette.mode === "light";
  const styleProps = { isLight, colours };
  
  const { news, loading, markNewsAsRead } = useNews();

  const renderContent = () => {
    if (loading) {
      return <LoadingState styleProps={styleProps} />;
    }
    
    if (news.length === 0) {
      return <EmptyState styleProps={styleProps} />;
    }
    
    return (
      <NewsList
        news={news}
        onMarkAsRead={markNewsAsRead}
        styleProps={styleProps}
      />
    );
  };
  
  return (
    <PageContainer styleProps={styleProps}>
      <PageHeader styleProps={styleProps} />
      {renderContent()}
    </PageContainer>
  );
};

export default ViewNews;