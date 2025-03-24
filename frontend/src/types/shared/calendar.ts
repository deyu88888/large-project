export interface SocietyData {
    id: number;
    name: string;
}

export interface EventData {
    id: number;
    title: string;
    description?: string;
    date: string;
    start_time: string;
    duration: string;
    location?: string;
    hosted_by: number;
    societyName?: string;
    rsvp?: boolean;
}

export interface CalendarEvent {
    id: number;
    title: string;
    start: Date;
    end: Date;
    description: string;
    location: string;
    societyId: number;
    societyName: string;
    rsvp: boolean;
}

export interface StudentCalendarProps {
    societies?: SocietyData[];
    userEvents?: EventData[];
    timezone?: string;
}