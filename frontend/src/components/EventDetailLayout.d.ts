import { ExtraModule } from "./SortableItem";
export interface EventData {
    title: string;
    mainDescription: string;
    date: string;
    startTime: string;
    duration: string;
    location: string;
    maxCapacity: number;
    coverImageUrl?: string;
    coverImageFile?: File | null;
    extraModules: ExtraModule[];
    participantModules: ExtraModule[];
    isParticipant: boolean;
    isMember: boolean;
    eventId: number;
    hostedBy: number;
    current_attendees: any[];
}
export declare function EventDetailLayout({ eventData }: {
    eventData: EventData;
}): import("react/jsx-runtime").JSX.Element;
