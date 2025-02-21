export type Society = {
    id: number;
    name: string;
    societyMembers: number[];
    roles: {};
    leader: number;
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