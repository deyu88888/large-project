export interface CalendarEvent extends BigCalendarEvent {
    id: string | number;
    title: string;
    start: Date;
    end: Date;
    description?: string;
    location?: string;
    hostedBy?: number;
}
