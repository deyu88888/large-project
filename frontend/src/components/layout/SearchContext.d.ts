import React, { ReactNode } from "react";
interface SearchContextProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
}
export declare const SearchContext: React.Context<SearchContextProps>;
export declare const SearchProvider: React.FC<{
    children: ReactNode;
}>;
export {};
