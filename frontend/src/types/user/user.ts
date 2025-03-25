export interface User {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    isActive: boolean;
    role: "student" | "admin";
    isSuperAdmin: boolean;
    isSuperuser: boolean;
    isStaff: boolean;
    following: User[];
    followers: User[];
    fullName: string;
    isStudent(): boolean;
    isAdmin(): boolean;
  }