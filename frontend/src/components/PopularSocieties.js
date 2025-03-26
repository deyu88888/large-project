import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useTheme } from "@mui/material/styles";
import { getPopularSocieties } from "../api";
const PopularSocieties = () => {
    const [popularSocieties, setPopularSocieties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // Access the current MUI theme
    const theme = useTheme();
    // Set background color dynamically
    const backgroundClass = theme.palette.mode === "dark" ? "bg-[#141b2d]" : "bg-[#ffffff]";
    // Set text color dynamically
    const headerTextClass = theme.palette.mode === "dark" ? "text-white" : "text-black";
    useEffect(() => {
        const fetchPopularSocieties = async () => {
            try {
                const data = await getPopularSocieties();
                setPopularSocieties(data);
                setLoading(false);
            }
            catch (err) {
                console.error(err);
                setError("Failed to fetch popular societies.");
                setLoading(false);
            }
        };
        fetchPopularSocieties();
    }, []);
    if (loading) {
        return (_jsx("p", { className: "text-center text-lg text-gray-600", children: "Loading popular societies..." }));
    }
    if (error) {
        return _jsx("p", { className: "text-center text-lg text-red-500", children: error });
    }
    return (_jsxs("div", { className: `${backgroundClass} backdrop-blur-lg rounded-2xl shadow-2xl p-8`, children: [_jsxs("h2", { className: `text-3xl font-extrabold flex items-center gap-3 mb-6 ${headerTextClass}`, children: [_jsx("span", { role: "img", "aria-label": "trophy", className: "text-5xl", children: "\uD83C\uDFC6" }), "Most Popular Societies"] }), popularSocieties.length === 0 ? (_jsx("p", { className: "text-center text-gray-500", children: "No popular societies found." })) : (_jsx("ul", { className: "grid grid-cols-1 sm:grid-cols-2 gap-6", children: popularSocieties.map((society) => (_jsx("li", { className: "bg-gradient-to-r from-gray-100 to-gray-200 p-6 rounded-2xl shadow-lg transform transition duration-300 hover:scale-105 hover:shadow-2xl", children: _jsxs("div", { className: "flex flex-col justify-between h-full", children: [_jsxs("div", { children: [_jsx("p", { className: "text-2xl font-bold text-gray-800", children: society.name }), _jsxs("p", { className: "mt-2 text-base text-gray-600", children: [_jsx("span", { className: "font-semibold", children: society.total_members }), " ", "Members \u2022", " ", _jsx("span", { className: "font-semibold", children: society.total_events }), " ", "Events \u2022", " ", _jsx("span", { className: "font-semibold", children: society.total_event_attendance }), " ", "Attendees"] })] }), _jsx("div", { className: "mt-4 text-right", children: _jsxs("span", { className: "inline-block bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-lg font-semibold px-4 py-2 rounded-full shadow-md", children: ["Score: ", society.popularity_score] }) })] }) }, society.id))) }))] }));
};
export default PopularSocieties;
