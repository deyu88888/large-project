import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
export const NewsCard = ({ news }) => {
    return (_jsxs("div", { style: { backgroundColor: "grey" }, children: [_jsxs("div", { children: [news.title, " "] }), _jsx("div", { children: news.content })] }));
};
