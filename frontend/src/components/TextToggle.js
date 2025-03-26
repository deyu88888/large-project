import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { Box } from "@mui/material";
export function TextToggle({ sortOption, setSortOption, commentsPerPage, setCommentsPerPage, setPage, }) {
    return (_jsxs(Box, { sx: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            mb: 2,
        }, children: [_jsxs(Box, { children: [_jsx("span", { style: { marginLeft: "8px", color: "#666" }, children: "by  " }), _jsx("span", { style: {
                            cursor: "pointer",
                            color: sortOption === "time" ? "#000" : "#999",
                            fontWeight: sortOption === "time" ? "bold" : "normal",
                        }, onClick: () => setSortOption("time"), children: "time" }), _jsx("span", { style: { margin: "0 8px" }, children: "|" }), _jsx("span", { style: {
                            cursor: "pointer",
                            color: sortOption === "popularity" ? "#000" : "#999",
                            fontWeight: sortOption === "popularity" ? "bold" : "normal",
                        }, onClick: () => setSortOption("popularity"), children: "popularity" })] }), _jsxs(Box, { children: [[10, 25, 50, 100].map((num, idx, arr) => (_jsxs(React.Fragment, { children: [_jsx("span", { style: {
                                    cursor: "pointer",
                                    color: commentsPerPage === num ? "#000" : "#999",
                                    fontWeight: commentsPerPage === num ? "bold" : "normal",
                                }, onClick: () => {
                                    setCommentsPerPage(num);
                                    setPage(1);
                                }, children: num }), idx < arr.length - 1 && _jsx("span", { style: { margin: "0 8px" }, children: "|" })] }, num))), _jsx("span", { style: { marginLeft: "8px", color: "#666" }, children: "per page" })] })] }));
}
