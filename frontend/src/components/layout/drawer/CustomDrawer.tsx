import { styled } from "@mui/material/styles";  
import { Theme } from "@mui/material/styles";  
import { CSSObject } from "@mui/system"; 
import type { StyledComponent } from "@mui/system";
import MuiAppBar, { AppBarProps as MuiAppBarProps } from "@mui/material/AppBar";
import MuiDrawer from "@mui/material/Drawer";

const drawerWidth = 240;

const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: "hidden",
  backgroundColor: theme.palette.background.default,
});

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: "hidden",
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up("sm")]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
  backgroundColor: theme.palette.background.default,
});

export const CustomDrawerHeader: StyledComponent<
  { theme: Theme },
  React.HTMLAttributes<HTMLDivElement>
> = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
}));


// export const CustomDrawerHeader = styled("div")(({ theme }: { theme: Theme }) => ({
//   display: "flex",
//   alignItems: "center",
//   justifyContent: "flex-end",
//   padding: theme.spacing(0, 1),
//   ...theme.mixins.toolbar,
// }));

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

// export const CustomAppBar = styled(MuiAppBar, {
//   shouldForwardProp: (prop) => prop !== "open",
// })<AppBarProps>(({ theme, open }: { theme: Theme; open?: boolean }) => ({
//   zIndex: theme.zIndex.drawer + 1,
//   marginLeft: open ? drawerWidth : 0,
//   width: open ? `calc(100% - ${drawerWidth}px)` : "100%",
//   transition: theme.transitions.create(["width", "margin"], {
//     easing: theme.transitions.easing.sharp,
//     duration: open
//       ? theme.transitions.duration.enteringScreen
//       : theme.transitions.duration.leavingScreen,
//   }),
// }));

export const CustomAppBar: StyledComponent<
  AppBarProps,
  {},
  AppBarProps
> = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})<AppBarProps>(({ theme, open }: { theme: Theme; open?: boolean }) => ({
  zIndex: theme.zIndex.drawer + 1,
  marginLeft: open ? drawerWidth : 0,
  width: open ? `calc(100% - ${drawerWidth}px)` : "100%",
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: open
      ? theme.transitions.duration.enteringScreen
      : theme.transitions.duration.leavingScreen,
  }),
}));


// export const CustomDrawer = styled(MuiDrawer, {
//   shouldForwardProp: (prop) => prop !== "open",
// })(({ theme, open }: { theme: Theme; open?: boolean }) => ({
//   width: drawerWidth,
//   flexShrink: 0,
//   whiteSpace: "nowrap",
//   boxSizing: "border-box",
//   ...(open
//     ? {
//         ...openedMixin(theme),
//         "& .MuiDrawer-paper": openedMixin(theme),
//       }
//     : {
//         ...closedMixin(theme),
//         "& .MuiDrawer-paper": closedMixin(theme),
//       }),
// }));

export const CustomDrawer: StyledComponent<
  { open?: boolean },
  {},
  {}
> = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }: { theme: Theme; open?: boolean }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  ...(open
    ? {
        ...openedMixin(theme),
        "& .MuiDrawer-paper": openedMixin(theme),
      }
    : {
        ...closedMixin(theme),
        "& .MuiDrawer-paper": closedMixin(theme),
      }),
}));
