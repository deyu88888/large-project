import { Button, styled, Theme } from "@mui/material";

export const StyledButton = styled(Button)(({ theme }: { theme: Theme }) => {
  const isLight = theme.palette.mode === "light";
  
  return {
    position: "relative",
    padding: "12px 24px",
    fontWeight: "bold",
    boxShadow: "none",
    overflow: "visible",
    backgroundColor: "transparent",
    borderRadius: 0,
    zIndex: 2,
    color: theme.palette.mode === "light" ? "black" : "white",

    "& .MuiButton-startIcon, & .MuiButton-endIcon, & span": {
      position: "relative",
      zIndex: 3,
    },

    "&::before": {
      content: '""',
      position: "absolute",
      border: `2.5px solid ${theme.palette.mode === 'light' ? 'black' : '#333333'}`,
      width: "100%",
      height: "100%",
      backgroundColor: theme.palette.mode === 'light' ? "#000000" : '#333333',
      top: "2px",
      left: "2px",
      borderRadius: 0,
      zIndex: 0,
      overflow: "hidden",
    },

    "&::after": {
      content: '""',
      position: "absolute",
      width: "100%",
      height: "100%",
      backgroundColor: isLight ? '#868dfb' : '#3e4396',
      border: `2.5px solid ${theme.palette.mode === 'light' ? 'black' : '#333333'}`,
      top: "-2px",
      left: "-2px",
      zIndex: 1,
      borderRadius: 0,
      overflow: "hidden",
    },

    "&:hover": {
      transform: "translate(0px, 0px)",
      
      "& .MuiButton-startIcon, & .MuiButton-endIcon, & span": {
        transform: "translate(4px, 4px)",
      },
    },


    "&:hover::after": {
      transform: "translate(4px, 4px)",
    },
  };
});