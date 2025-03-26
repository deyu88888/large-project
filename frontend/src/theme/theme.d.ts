type ThemeMode = "light" | "dark";
type ColorTokens = {
    grey: Record<number, string>;
    primary: Record<number, string>;
    greenAccent: Record<number, string>;
    redAccent: Record<number, string>;
    blueAccent: Record<number, string>;
    yellowAccent: Record<number, string>;
};
export declare const tokens: (mode: ThemeMode) => ColorTokens;
export declare const themeSettings: (mode: ThemeMode) => {
    palette: {
        mode: ThemeMode;
        primary: {
            main: string;
        };
        secondary: {
            dark: string;
            main: string;
        };
        greenAccent: {
            main: string;
            light: string;
            dark: string;
        };
        neutral: {
            dark: string;
            main: string;
            light: string;
        };
        background: {
            default: string;
        };
    };
    typography: {
        fontFamily: string;
        fontSize: number;
        h1: {
            fontSize: number;
            fontFamily: string;
            fontWeight: string;
        };
        h2: {
            fontSize: number;
            fontFamily: string;
        };
        h3: {
            fontSize: number;
            fontFamily: string;
        };
        h4: {
            fontSize: number;
        };
        h5: {
            fontSize: number;
        };
        h6: {
            fontSize: number;
        };
    };
};
export {};
