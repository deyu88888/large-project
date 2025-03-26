type UserRole = "admin" | "student";
interface PrivateGuardProps {
    children: React.ReactNode;
    requiredRole?: UserRole;
}
export declare function PrivateGuard({ children, requiredRole }: PrivateGuardProps): import("react/jsx-runtime").JSX.Element;
export {};
