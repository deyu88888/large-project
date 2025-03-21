import { DashboardNavbar } from "../components/dashboard/DashboardNavbar";
import { SearchProvider } from "../components/layout/SearchContext";

export default function Dashboard() {
  return (
    <div>
        <SearchProvider>
            <DashboardNavbar />
        </SearchProvider>
    </div>
  );
}
