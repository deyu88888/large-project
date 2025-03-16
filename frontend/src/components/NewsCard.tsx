import { News } from "../types";

export const NewsCard = ({ news }: { news: News }) => {
    return (
        <div style={{backgroundColor:"grey"}}>
            <div>{news.title} </div>
            <div>{news.content}</div>
        </div>
    )
}