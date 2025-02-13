import React, { createContext, useState, ReactNode } from "react";

interface SearchContextProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export const SearchContext = createContext<SearchContextProps>({
  searchTerm: "",
  setSearchTerm: () => {},
});

export const SearchProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <SearchContext.Provider value={{ searchTerm, setSearchTerm }}>
      {children}
    </SearchContext.Provider>
  );
};