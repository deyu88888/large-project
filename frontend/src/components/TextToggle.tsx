import React from "react";
import { Box } from "@mui/material";

interface TextToggleProps {
  sortOption: "time" | "popularity";
  setSortOption: (value: "time" | "popularity") => void;
  commentsPerPage: number;
  setCommentsPerPage: (value: number) => void;
  setPage: (value: number) => void;
}

export function TextToggle({
  sortOption,
  setSortOption,
  commentsPerPage,
  setCommentsPerPage,
  setPage,
}: TextToggleProps) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        mb: 2,
      }}
    >
      <Box>
        <span style={{ marginLeft: "8px", color: "#666" }}>by  </span>
        <span
          style={{
            cursor: "pointer",
            color: sortOption === "time" ? "#000" : "#999",
            fontWeight: sortOption === "time" ? "bold" : "normal",
          }}
          onClick={() => setSortOption("time")}
        >
          time
        </span>
        <span style={{ margin: "0 8px" }}>|</span>
        <span
          style={{
            cursor: "pointer",
            color: sortOption === "popularity" ? "#000" : "#999",
            fontWeight: sortOption === "popularity" ? "bold" : "normal",
          }}
          onClick={() => setSortOption("popularity")}
        >
          popularity
        </span>
      </Box>

      <Box>
        {[10, 25, 50, 100].map((num, idx, arr) => (
          <React.Fragment key={num}>
            <span
              style={{
                cursor: "pointer",
                color: commentsPerPage === num ? "#000" : "#999",
                fontWeight: commentsPerPage === num ? "bold" : "normal",
              }}
              onClick={() => {
                setCommentsPerPage(num);
                setPage(1);
              }}
            >
              {num}
            </span>
            {idx < arr.length - 1 && <span style={{ margin: "0 8px" }}>|</span>}
          </React.Fragment>
        ))}
        <span style={{ marginLeft: "8px", color: "#666" }}>per page</span>
      </Box>
    </Box>
  );
}
