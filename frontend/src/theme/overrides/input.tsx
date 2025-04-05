import { Components, Theme } from "@mui/material/styles";

export const inputsCustomizations = (
  mode: "light" | "dark"
): Components<Theme> => {
  return {
    MuiTextField: {
      defaultProps: {
        variant: "outlined",
      },
      styleOverrides: {
        root: {
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: mode === "light" ? "black" : "white",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: mode === "light" ? "black" : "white",
          },
        },
      },
    },
    MuiSelect: {
      defaultProps: {
        variant: "outlined",
      },
      styleOverrides: {
        root: {
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: mode === "light" ? "black" : "white",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: mode === "light" ? "black" : "white",
          },
        },
      },
    },
    MuiFormControl: {
      defaultProps: {
        variant: "outlined",
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: mode === "light" ? "black" : "white",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: mode === "light" ? "black" : "white",
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: mode === "light" ? "black" : "white",
          "&.Mui-focused": {
            color: mode === "light" ? "black" : "white",
          },
        },
      },
    },
  };
};
