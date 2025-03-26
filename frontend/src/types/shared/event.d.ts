export interface Attendee {
    id: number;
    first_name: string;
    icon?: string | null;
}
export interface EventData {
    id: number;
    title: string;
    date: string;
    location: string;
    main_description?: string;
    cover_image?: string;
    current_attendees?: Attendee[];
}
export interface EventCardProps {
    event: EventData;
    isLight: boolean;
    colors: any;
    onViewEvent: (id: number) => void;
    followingsAttending?: Attendee[];
}
