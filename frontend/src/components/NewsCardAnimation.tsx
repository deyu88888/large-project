import { useEffect, useState } from "react";
import { NewsCard } from "./NewsCard";
import { News } from "../types";
import "./NewsCardAnimation.css";

export const NewsCardAnimation = () => {
    const [news, setNews] = useState<News[]>([]);
    const [index, setIndex] = useState(0);
    const [flipping, setFlipping] = useState(false);

    useEffect(() => {
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
        ];
        setNews(response);
    }, []);

    const handleNextNewsCard = () => {
        if (news.length === 0) return;

        setFlipping(true);
        setTimeout(() => {
            setIndex((prevIndex) => (prevIndex + 1) % news.length);
            setFlipping(false);
        }, 500);
    };

    return (
        <div
            data-testid="card-container"
            className={`card-container ${flipping ? "flip" : ""}`}
            onClick={handleNextNewsCard}
        >
            {news.length > 0 && <NewsCard news={news[index]} />}
        </div>
    );
};