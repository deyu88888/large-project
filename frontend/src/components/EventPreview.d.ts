import { EventData } from "./EventDetailLayout";
interface Props {
    open: boolean;
    onClose: () => void;
    eventData: EventData;
}
export declare function EventPreview({ open, onClose, eventData }: Props): import("react/jsx-runtime").JSX.Element;
export {};
