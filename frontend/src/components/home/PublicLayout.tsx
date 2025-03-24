import { DashboardNavbar } from "./DashboardNavbar";
import { SearchProvider } from "../layout/SearchContext";
import { Box } from "@mui/material";
import { DashboardFooter } from "./DashboardFooter";
import HeroSection from "./HeroSection";
import { useLocation } from "react-router-dom";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const location = useLocation();

  const heroContent = {
    "/": {
      title: "Welcome to Infinite Loop Innovators",
      subtitle: "Discover societies, events, and latest news all in one place",
      showCarousel: true,
      breadcrumbs: [{ label: "Home" }]
    },
    "/search": {
      title: "Discover",
      subtitle: "Find the perfect community for you!",
      showCarousel: false,
      breadcrumbs: [
        { label: "Home", href: "/" },
        { label: "Discover" }
      ]
    },
    "/all-societies": {
      title: "Explore Campus Societies",
      subtitle: "Find the perfect community for you",
      showCarousel: false,
      breadcrumbs: [
        { label: "Home", href: "/" },
        { label: "Societies" }
      ]
    },
    "/all-events": {
      title: "Explore Campus Events",
      subtitle: "Find the perfect event for you",
      showCarousel: false,
      breadcrumbs: [
        { label: "Home", href: "/" },
        { label: "Events" }
      ]
    },
    "/calendar": {
      title: "Our Calendar",
      subtitle: "Keep track of all the events happening around you",
      showCarousel: false,
      breadcrumbs: [
        { label: "Home", href: "/" },
        { label: "Calendar" }
      ]
    },
    "/support": {
      title: "Support Centre",
      subtitle: "Reach out to us with any queries or concerns",
      showCarousel: false,
      breadcrumbs: [
        { label: "Home", href: "/" },
        { label: "Support" }
      ]
    },
  } as const;

  type HeroPath = keyof typeof heroContent;
  const path = location.pathname as HeroPath;

  const currentHero = heroContent[path] ?? {
    title: "Welcome!",
    subtitle: "Explore our platform.",
    showCarousel: false,
    breadcrumbs: [
      { label: "Home", href: "/" },
      { label: location.pathname.split('/').pop() || "Page" }
    ]
  };
  
  return (
    <SearchProvider>
      <Box minHeight={"100vh"} display={"flex"} flexDirection={"column"}>
        <DashboardNavbar />
        <HeroSection
          showCarousel={currentHero.showCarousel}
          title={currentHero.title}
          subtitle={currentHero.subtitle}
          breadcrumbs={currentHero.breadcrumbs}
        />
        <Box flexGrow={1} marginBottom={3}>
          {children}
        </Box>
        <DashboardFooter />
      </Box>
    </SearchProvider>
  );
}