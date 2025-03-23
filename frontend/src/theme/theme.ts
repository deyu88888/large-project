type ThemeMode = "light" | "dark";

type ColorTokens = {
  grey: Record<number, string>;
  primary: Record<number, string>;
  accent1: Record<number, string>;
  accent2: Record<number, string>;
  accent3: Record<number, string>;
};

// color design tokens with new palette
export const tokens = (mode: ThemeMode): ColorTokens => ({
  ...(mode === "dark"
    ? {
        grey: {
          100: "#F2E8CF", // Parchment
          200: "#F4EDD9",
          300: "#F7F1E2",
          400: "#FAF6EC",
          500: "#FCFAF5",
          600: "#C5BBB5",
          700: "#8F8880",
          800: "#59554B",
          900: "#2C2A25",
        },
        primary: {
          100: "#DACFE7", // English Violet lighter shades
          200: "#B59FCE",
          300: "#906FB6",
          400: "#6C4A93",
          500: "#483162", // English Violet DEFAULT
          600: "#3A284F",
          700: "#2B1E3B",
          800: "#1D1427",
          900: "#0E0A14",
        },
        accent1: {
          100: "#F5F3FF", // Periwinkle lighter shades
          200: "#EBE7FF",
          300: "#E2DAFF",
          400: "#D8CEFF",
          500: "#D0C4FF", // Periwinkle DEFAULT
          600: "#A092FF", // Tropical Indigo DEFAULT
          700: "#8668FF",
          800: "#3E0EFF",
          900: "#2400B4",
        },
        accent2: {
          100: "#D7E9D3", // Fern Green lighter shades
          200: "#B0D3A6",
          300: "#88BD7A",
          400: "#63A451",
          500: "#47763A", // Fern Green DEFAULT
          600: "#A7C957", // Yellow Green DEFAULT
          700: "#8AAD38",
          800: "#67812A",
          900: "#45561C",
        },
        accent3: { // Keeping a variation of your redAccent for alerts/warnings
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
      }
    : {
        grey: {
          100: "#2C2A25", // Inverted for light mode
          200: "#59554B",
          300: "#8F8880",
          400: "#C5BBB5",
          500: "#FCFAF5",
          600: "#FAF6EC",
          700: "#F7F1E2",
          800: "#F4EDD9", 
          900: "#F2E8CF", // Parchment
        },
        primary: {
          100: "#0E0A14", // Inverted for light mode
          200: "#1D1427",
          300: "#2B1E3B",
          400: "#F7F4EA", // Light background
          500: "#FCFCFC", // White background
          600: "#483162", // English Violet DEFAULT
          700: "#6C4A93",
          800: "#906FB6",
          900: "#B59FCE",
        },
        accent1: {
          100: "#2400B4", // Inverted for light mode
          200: "#3E0EFF",
          300: "#8668FF",
          400: "#A092FF", // Tropical Indigo DEFAULT
          500: "#B5A9FF",
          600: "#C7BFFF",
          700: "#D0C4FF", // Periwinkle DEFAULT
          800: "#E2DAFF",
          900: "#F5F3FF",
        },
        accent2: {
          100: "#45561C", // Inverted for light mode
          200: "#67812A",
          300: "#8AAD38",
          400: "#A7C957", // Yellow Green DEFAULT
          500: "#47763A", // Fern Green DEFAULT
          600: "#63A451",
          700: "#88BD7A",
          800: "#B0D3A6",
          900: "#D7E9D3",
        },
        accent3: { // Keeping variations of your redAccent
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
      }),
});

// mui theme settings with new palette
export const themeSettings = (mode: ThemeMode) => {
  const colors = tokens(mode);
  return {
    palette: {
      mode: mode,
      primary: {
        dark: colors.primary[700], // Tropical Indigo
        main: colors.accent1[400], // Periwinkle
        light: colors.accent1[600],
      },
      secondary: {
        dark: colors.accent2[400], // Fern Green
        main: colors.accent2[500], // Yellow Green
        light: colors.accent2[600],
      },
      neutral: {
        dark: colors.grey[700],
        main: colors.grey[500],
        light: colors.grey[100],
      },
      background: {
        default: mode === "dark" ? colors.primary[500] : "#fcfcfc",
        paper: mode === "dark" ? colors.primary[600] : colors.grey[900], // Parchment in light mode
      },
      error: {
        main: colors.accent3[500]
      },
    },
    typography: {
      fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
      fontSize: 12,
      h1: { fontSize: 40 },
      h2: { fontSize: 32 },
      h3: { fontSize: 24 },
      h4: { fontSize: 20 },
      h5: { fontSize: 16 },
      h6: { fontSize: 14 },
    },
  };
};