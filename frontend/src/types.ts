
export type Society = {
    id: number;
    name: string;
    societyMembers: number[];
    roles: {};
    president: number;
    category: string;
    socialMediaLinks: {};
    timetable: string | null;
    membershipRequirements: string | null;
    upcomingProjectsOrPlans: string | null;
};

export type SocietyEvent = {        // avoid naming conflicts with JavaScript's built-in Event type
    id: number;
    title: string;
    description: string;
    date: string;
    startTime: string;
    duration: string;
    hostedBy: number;
    location: string;
  };

export interface Student {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    isActive: boolean;
    role: string;
    major: string;
    societies: string[];
    presidentOf: number[];
    isPresident: boolean;
  }
  
  export interface Report {
    id: number;
    from_student: string;
    report_type: string;
    subject: string;
    details: string;
    created_at: string;
};

export interface Event {
    id: number;
    title: string;
    description: string;
    date: string;
    startTime: string;
    duration: string;
    hostedBy: number;
    location: string;
  };

  export type News = {
    id: number;
    title: string;
    brief: string;
    content: string;
    // is_read: boolean;  // add after backend is fixed
};