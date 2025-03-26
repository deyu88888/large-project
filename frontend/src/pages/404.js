import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
const NotFound = () => {
    return (_jsxs("div", { className: "flex flex-col items-center justify-center h-screen bg-gray-100 text-gray-800", children: [_jsx("h1", { className: "text-6xl font-bold mb-4", children: "404" }), _jsx("p", { className: "text-xl mb-8", children: "Page Not Found" }), _jsx(Link, { to: "/", className: "px-6 py-2 bg-blue-500 text-white rounded shadow hover:bg-blue-600 transition", children: "Go Back Home" })] }));
};
export default NotFound;
