import { DashboardNavbar } from "./DashboardNavbar";
import { SearchProvider } from "../layout/SearchContext";

export default function PublicLayout(props: { children: React.ReactNode }) {
  return (
    <div>
      <SearchProvider>
        <DashboardNavbar />
        {props.children}
      </SearchProvider>
    </div>
  );
}
