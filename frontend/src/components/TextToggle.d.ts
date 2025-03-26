interface TextToggleProps {
    sortOption: "time" | "popularity";
    setSortOption: (value: "time" | "popularity") => void;
    commentsPerPage: number;
    setCommentsPerPage: (value: number) => void;
    setPage: (value: number) => void;
}
export declare function TextToggle({ sortOption, setSortOption, commentsPerPage, setCommentsPerPage, setPage, }: TextToggleProps): import("react/jsx-runtime").JSX.Element;
export {};
