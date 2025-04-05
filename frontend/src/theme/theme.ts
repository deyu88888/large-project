import { inputsCustomizations } from "./overrides/input";

type ThemeMode = "light" | "dark";

export type ColorTokens = {
  grey: Record<number, string>;
  primary: Record<number, string>;
  greenAccent: Record<number, string>;
  redAccent: Record<number, string>;
  blueAccent: Record<number, string>;
  yellowAccent: Record<number, string>;
  purpleAccent: Record<number, string>;
  orangeAccent: Record<number, string>;
};

// color design tokens
export const tokens = (mode: ThemeMode): ColorTokens => ({
  ...(mode === "dark"
    ? {
        grey: {
          100: "#e0e0e0",
          200: "#c2c2c2",
          300: "#a3a3a3",
          400: "#858585",
          500: "#666666",
          600: "#525252",
          700: "#3d3d3d",
          800: "#292929",
          900: "#141414",
        },
        primary: {
          100: "#d0d1d5",
          200: "#a1a4ab",
          300: "#727681",
          400: "#1F2A40",
          500: "#141b2d",
          600: "#101624",
          700: "#0c101b",
          800: "#080b12",
          900: "#040509",
        },
        greenAccent: {
          100: "#dbf5ee",
          200: "#b7ebde",
          300: "#94e2cd",
          400: "#70d8bd",
          500: "#4cceac",
          600: "#3da58a",
          700: "#2e7c67",
          800: "#1e5245",
          900: "#0f2922",
        },
        redAccent: {
          100: "#f8dcdb",
          200: "#f1b9b7",
          300: "#e99592",
          400: "#e2726e",
          500: "#db4f4a",
          600: "#af3f3b",
          700: "#832f2c",
          800: "#58201e",
          900: "#2c100f",
        },
        blueAccent: {
          100: "#e1e2fe",
          200: "#c3c6fd",
          300: "#a4a9fc",
          400: "#868dfb",
          500: "#6870fa",
          600: "#535ac8",
          700: "#3e4396",
          800: "#2a2d64",
          900: "#151632",
        },
        yellowAccent: {
          100: "#f9f9a0",
          200: "#f7f56a",
          300: "#f5f433",
          400: "#f3f000",
          500: "#f2e000",
        },
        purpleAccent: {
          100: "#f4e7ff",
          200: "#d9beff",
          300: "#b894ff",
          400: "#9a6dff",
          500: "#8047FF",
          600: "#6635cc",
          700: "#4d2599",
          800: "#331766",
          900: "#1a0833",
        },
        orangeAccent: {
          100: "#fff2e6",
          200: "#ffe0cc",
          300: "#ffcdb3",
          400: "#ffb999",
          500: "#FF8C52",
          600: "#cc7042",
          700: "#995431",
          800: "#663821",
          900: "#331c10",
        },
      }
    : {
        grey: {
          100: "#141414",
          200: "#292929",
          300: "#3d3d3d",
          400: "#525252",
          500: "#666666",
          600: "#858585",
          700: "#a3a3a3",
          800: "#c2c2c2",
          900: "#e0e0e0",
        },
        primary: {
          100: "#040509",
          200: "#080b12",
          300: "#0c101b",
          400: "#f2f0f0",
          500: "#fcfcfc",
          600: "#1F2A40",
          700: "#727681",
          800: "#a1a4ab",
          900: "#d0d1d5",
        },
        greenAccent: {
          100: "#0f2922",
          200: "#1e5245",
          300: "#2e7c67",
          400: "#3da58a",
          500: "#4cceac",
          600: "#70d8bd",
          700: "#94e2cd",
          800: "#b7ebde",
          900: "#dbf5ee",
        },
        redAccent: {
          100: "#2c100f",
          200: "#58201e",
          300: "#832f2c",
          400: "#af3f3b",
          500: "#db4f4a",
          600: "#e2726e",
          700: "#e99592",
          800: "#f1b9b7",
          900: "#f8dcdb",
        },
        blueAccent: {
          100: "#151632",
          200: "#2a2d64",
          300: "#3e4396",
          400: "#535ac8",
          500: "#6870fa",
          600: "#868dfb",
          700: "#a4a9fc",
          800: "#c3c6fd",
          900: "#e1e2fe",
        },
        yellowAccent: {
          100: "#f9f9a0",
          200: "#f7f56a",
          300: "#f5f433",
          400: "#f3f000",
          500: "#f2e000",
        },
        purpleAccent: {
          100: "#f4e7ff",
          200: "#d9beff",
          300: "#b894ff",
          400: "#9a6dff",
          500: "#8047FF",
          600: "#6635cc",
          700: "#4d2599",
          800: "#331766",
          900: "#1a0833",
        },
        orangeAccent: {
          100: "#fff2e6",
          200: "#ffe0cc",
          300: "#ffcdb3",
          400: "#ffb999",
          500: "#FF8C52",
          600: "#cc7042",
          700: "#995431",
          800: "#663821",
          900: "#331c10",
        },
      }),
});

// mui theme settings
export const themeSettings = (mode: ThemeMode) => {
  const colors = tokens(mode);
  return {
    palette: {
      mode: mode,
      primary: {
        main: colors.primary[500],
      },
      secondary: {
        dark: colors.blueAccent[800],
        main: colors.blueAccent[500],
      },
      greenAccent: {
        main: colors.greenAccent[500],
        light: colors.greenAccent[200],
        dark: colors.greenAccent[700],
      },
      neutral: {
        dark: colors.grey[700],
        main: colors.grey[500],
        light: colors.grey[100],
      },
      background: {
        default: mode === "dark" ? colors.primary[500] : "#fcfcfc",
      },
    },
    typography: {
      fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
      fontSize: 12,
      h1: {
        fontSize: 40,
        fontFamily: "Monaco, monospace",
        fontWeight: "bold",
      },
      h2: {
        fontSize: 32,
        fontFamily: "Monaco, monospace",
      },
      h3: {
        fontSize: 24,
        fontFamily: "Monaco, monospace",
      },
      h4: {
        fontSize: 20,
      },
      h5: {
        fontSize: 16,
      },
      h6: {
        fontSize: 14,
      },
    },
    components: {
      ...inputsCustomizations(mode),
    },
  };
};
