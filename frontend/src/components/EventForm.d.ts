import React from "react";
import { ExtraModule } from "./SortableItem";
interface EventFormProps {
    initialData?: {
        title: string;
        mainDescription: string;
        date: string;
        startTime: string;
        duration: string;
        location: string;
        maxCapacity: number;
        coverImageFile?: File | null;
        coverImageUrl?: string;
        extraModules: ExtraModule[];
        participantModules: ExtraModule[];
        adminReason: string;
    };
    onSubmit: (formData: FormData) => Promise<void>;
    submitButtonText?: string;
    isEditMode?: boolean;
}
export declare const EventForm: React.FC<EventFormProps>;
export type EventFormInitialData = EventFormProps["initialData"];
export {};
