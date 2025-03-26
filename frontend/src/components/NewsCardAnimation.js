import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { NewsCard } from "./NewsCard";
import "./NewsCardAnimation.css"; // Import CSS
export const NewsCardAnimation = () => {
    const [news, setNews] = useState([]);
    const [index, setIndex] = useState(0);
    const [flipping, setFlipping] = useState(false);
    useEffect(() => {
        // TODO: replace response with actual API call after backend is ready
        const response = [
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
    }, []);
    const handleNextNewsCard = () => {
        if (news.length === 0)
            return;
        setFlipping(true);
        setTimeout(() => {
            setIndex((prevIndex) => (prevIndex + 1) % news.length);
            setFlipping(false);
        }, 500); // Match the animation duration
    };
    return (_jsx("div", { className: `card-container ${flipping ? "flip" : ""}`, onClick: handleNextNewsCard, children: news.length > 0 && _jsx(NewsCard, { news: news[index] }) }));
};
