import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useState } from "react";
export const SearchContext = createContext({
    searchTerm: "",
    setSearchTerm: () => { },
});
export const SearchProvider = ({ children }) => {
    const [searchTerm, setSearchTerm] = useState("");
    return (_jsx(SearchContext.Provider, { value: { searchTerm, setSearchTerm }, children: children }));
};
