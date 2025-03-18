import React, { useState, useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../theme/theme";
import { News } from "../../types"; 


const ViewNews: React.FC = () => {
    const theme = useTheme();
    const colours = tokens(theme.palette.mode);
    const isLight = theme.palette.mode === "light";

    const [news, setNews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNews = async () => {

            const response: News[] = [
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
            ]
            setNews(response);
        };
        fetchNews();
    }, []);

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
                <header
                    style={{
                        textAlign: "center",
                        marginBottom: "2.5rem",
                        padding: "2rem 0",
                    }}
                >
                    <h1
                        style={{
                            color: isLight ? colours.grey[100] : colours.grey[100],
                            fontSize: "2.25rem",
                            fontWeight: 700,
                            marginBottom: "0.5rem",
                        }}
                    >
                        All News
                    </h1>
                    <p
                        style={{
                            color: isLight ? colours.grey[300] : colours.grey[300],
                            fontSize: "1.125rem",
                            margin: 0,
                        }}
                    >
                        Stay informed about the latest news and announcements.
                    </p>
                </header>

                {loading ? (
                    <p
                        style={{
                            color: isLight ? colours.grey[700] : colours.grey[300],
                            textAlign: "center",
                            fontSize: "1.125rem",
                        }}
                    >
                        Loading News...
                    </p>
                ) : news.length === 0 ? (
                    <p
                        style={{
                            color: isLight ? colours.grey[600] : colours.grey[300],
                            textAlign: "center",
                            fontSize: "1.125rem",
                        }}
                    >
                        No new News.
                    </p>
                ) : (
                    <div className="space-y-6">
                        {news.map((item) => (
                            <div
                                key={item.id}
                                className="p-5 rounded-lg shadow-md hover:shadow-lg transition-all border"
                                style={{
                                    backgroundColor: item.is_read
                                        ? isLight
                                            ? colours.primary[400]
                                            : colours.primary[400]
                                        : isLight
                                            ? colours.blueAccent[700]
                                            : colours.blueAccent[700],
                                    borderColor: item.is_read
                                        ? isLight
                                            ? colours.grey[300]
                                            : colours.grey[700]
                                        : isLight
                                            ? colours.blueAccent[400]
                                            : colours.blueAccent[400],
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}
                                >
                                    <div style={{ color: isLight ? colours.grey[100] : colours.grey[100] }}>
                                        <b>{item.title}</b>
                                        <p>{item.brief}</p>
                                    </div>
                                    <div style={{ display: "flex", gap: "1rem" }}>
                                        {item.is_read ? (
                                            <span
                                                style={{
                                                    color: colours.greenAccent[500],
                                                    fontSize: "0.875rem",
                                                    fontWeight: 500,
                                                }}
                                            >
                                                Read
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => markNewsAsRead(item.id)}
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
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ViewNews;
