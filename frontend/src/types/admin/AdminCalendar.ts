export interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    description?: string;
    location?: string;
    hostedBy?: string;
  }
  
  export interface CustomEventProps {
    event: CalendarEvent;
  }
  
  export interface MoreEventsState {
    open: boolean;
    data: CalendarEvent[];
  }
  
  export interface TimeGroup {
    title: string;
    items: CalendarEvent[];
  }
  
  export interface EventWrapperProps {
    event: CalendarEvent;
    children: React.ReactNode;
  }
  
  export interface ShowMoreProps {
    events: CalendarEvent[];
  }
  
  export interface CalendarComponents {
    event: React.ComponentType<CustomEventProps>;
    eventWrapper: React.ComponentType<EventWrapperProps>;
    showMore: React.ComponentType<ShowMoreProps>;
  }
  
  export const EVENT_COLORS = [
    "#6c5ce7",
    "#00cec9",
    "#fd79a8",
    "#fdcb6e",
    "#e17055",
    "#0984e3",
    "#00b894",
  ];