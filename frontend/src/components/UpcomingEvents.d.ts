import React from "react";
interface UpcomingEvent {
    id: number;
    title: string;
    start: Date;
    end: Date;
}
interface UpcomingEventsProps {
    events: UpcomingEvent[];
}
declare const _default: React.NamedExoticComponent<UpcomingEventsProps>;
export default _default;
