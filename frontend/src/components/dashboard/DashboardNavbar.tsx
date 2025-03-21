import {
    alpha,
  AppBar,
  Avatar,
  Box,
  Button,
  colors,
  Container,
  IconButton,
  InputBase,
  List,
  ListItem,
  ListItemText,
  Menu,
  MenuItem,
  styled,
  Toolbar,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { useContext, useState } from "react";
import { useNavigate } from 'react-router-dom';
import AdbIcon from '@mui/icons-material/Adb';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from "@mui/icons-material/Search";
import { SearchContext } from "../../components/layout/SearchContext";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import { useSettingsStore } from "../../stores/settings-store";


const navItems = [
  {
    title: "Home",
    path: "/",
  },
  {
    title: "About",
    path: "/about",
  },
];
const pages = [
    { name: 'Home', path: '/' },
    { name: 'Societies', path: '/societies' },
    { name: 'Events', path: '/all-events' },
    { name: 'Calendar', path: '/calendar' },
    { name: 'News', path: '/news' },
    { name: 'Contact', path: '/contact' }
  ];
const settings = ['Register', 'Login', 'Light/Dark'];

const Search = styled('div')(({ theme }) => ({
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: alpha(theme.palette.common.white, 0.15),
    '&:hover': {
      backgroundColor: alpha(theme.palette.common.white, 0.25),
    },
    marginRight: theme.spacing(2),
    marginLeft: 0,
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      marginLeft: theme.spacing(3),
      width: 'auto',
    },
  }));
  
  const SearchIconWrapper = styled('div')(({ theme }) => ({
    padding: theme.spacing(0, 2),
    height: '100%',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }));
  
  const StyledInputBase = styled(InputBase)(({ theme }) => ({
    color: 'inherit',
    '& .MuiInputBase-input': {
      padding: theme.spacing(1, 1, 1, 0),
      // vertical padding + font size from searchIcon
      paddingLeft: `calc(1em + ${theme.spacing(4)})`,
      transition: theme.transitions.create('width'),
      width: '100%',
      [theme.breakpoints.up('md')]: {
        width: '20ch',
      },
    },
  }));

export const DashboardNavbar = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { toggleThemeMode } = useSettingsStore();
    const { searchTerm, setSearchTerm } = useContext(SearchContext);

    const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null);
    const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);

    const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorElNav(event.currentTarget);
    };
    const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorElUser(event.currentTarget);
    };

    const handleCloseNavMenu = () => {
        setAnchorElNav(null);
    };

    const handleCloseUserMenu = () => {
        setAnchorElUser(null);
    };
    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
    };
    const handleThemeToggle = () => {
        toggleThemeMode();
        handleCloseUserMenu();
    };
    const settingsActions: { [key: string]: () => void } = {
        'Register': () => navigate('/register'),
        'Login': () => navigate('/login'),
        'Light/Dark': handleThemeToggle
      };


  return (
    <AppBar position="sticky" sx={{
        bgcolor: (theme) => 
          theme.palette.mode === "dark" 
            ? theme.palette.primary.dark
            : theme.palette.primary.light
      }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <AdbIcon sx={{ display: { xs: "none", md: "flex" }, mr: 1, color: "white"}} />
          
          <Typography
            variant="h6"
            noWrap
            component="a"
            href="#app-bar-with-responsive-menu"
            sx={{
              mr: 2,
              display: { xs: "none", md: "flex" },
              fontFamily: "monospace",
              fontWeight: 700,
              color: "white",
              letterSpacing: ".3rem",
              textDecoration: "none",
            }}
          >
            LOGO
          </Typography>

          <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" } }}>
            {pages.map((page) => (
                <Button
                key={page.name}
                onClick={() => {
                    handleCloseNavMenu();
                    navigate(page.path);
                }}
                sx={{ my: 2, color: "white", display: "block" }}
                >
                {page.name}
                </Button>
            ))}
        </Box>

          <Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" } }}>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
                id="menu-appbar"
                anchorEl={anchorElNav}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "left",
                }}
                keepMounted
                transformOrigin={{
                    vertical: "top",
                    horizontal: "left",
                }}
                open={Boolean(anchorElNav)}
                onClose={handleCloseNavMenu}
                sx={{ display: { xs: "block", md: "none" } }}
                >
                {pages.map((page) => (
                    <MenuItem 
                    key={page.name} 
                    onClick={() => {
                        handleCloseNavMenu();
                        navigate(page.path);
                    }}
                    >
                    <Typography sx={{ textAlign: "center" }}>{page.name}</Typography>
                    </MenuItem>
                ))}
                </Menu>
          </Box>
          <AdbIcon sx={{ display: { xs: "flex", md: "none" }, mr: 1 }} />
          <Typography
            variant="h5"
            noWrap
            component="a"
            href="#app-bar-with-responsive-menu"
            sx={{
              mr: 2,
              display: { xs: "flex", md: "none" },
              flexGrow: 1,
              fontFamily: "monospace",
              fontWeight: 700,
              letterSpacing: ".3rem",
              color: "inherit",
              textDecoration: "none",
            }}
          >
            LOGO
          </Typography>
          
          <Search>
            <SearchIconWrapper>
                <SearchIcon />
            </SearchIconWrapper>
            <StyledInputBase 
                placeholder="Search…" 
                inputProps={{ "aria-label": "search" }}
                value={searchTerm}
                onChange={handleSearchChange}
            />
            </Search>
          
          <Box sx={{ flexGrow: 0 }}>
            <Tooltip title="Open settings">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar alt="Remy Sharp" src="/static/images/avatar/2.jpg" />
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: "45px" }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              {settings.map((setting) => (
                <MenuItem key={setting} onClick={settingsActions[setting] || handleCloseUserMenu}>
                    <Typography sx={{ textAlign: "center" }}>
                    {setting === 'Light/Dark' ? (
                        <>
                        {theme.palette.mode === "dark" ? "Light Mode" : "Dark Mode"}
                        {theme.palette.mode === "dark" ? 
                            <LightModeOutlinedIcon sx={{ ml: 1, p:0.1 }} /> : 
                            <DarkModeOutlinedIcon sx={{ ml: 1, p:0.1 }} />
                        }
                        </>
                    ) : (
                        setting
                    )}
                    </Typography>
                </MenuItem>
                ))}
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};