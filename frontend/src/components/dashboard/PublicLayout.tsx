import { DashboardNavbar } from "./DashboardNavbar";
import { SearchProvider } from "../layout/SearchContext";
import { Box } from "@mui/material";
import { DashboardFooter } from "./DashboardFooter";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SearchProvider>
      <Box minHeight={"100vh"} display={"flex"} flexDirection={"column"}>
        <DashboardNavbar />
        <Box flexGrow={1} marginBottom={3}>
          {children}
        </Box>
        <DashboardFooter />
      </Box>
    </SearchProvider>
  );
}
