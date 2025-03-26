export interface User {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    isActive: boolean;
    role: "student" | "admin";
    isSuperAdmin: boolean;
    isSuperuser: boolean;
    isStaff: boolean;
    following: number[];
    followers: number[];
    fullName: string;
    isStudent(): boolean;
    isAdmin(): boolean;
    is_active: boolean;
    is_following?: boolean;
    icon?: string;
  }