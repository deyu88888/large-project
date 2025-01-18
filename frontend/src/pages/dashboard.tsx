import { useAuthStore } from "../stores/auth-store";

export default function DashboardPage() {
  const { user } = useAuthStore();

  return <>{JSON.stringify(user)}</>;
}
