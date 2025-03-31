import React from "react";
import { tokens } from "../../theme/theme";
import { CalendarEvent } from "../shared/calendar";

export interface StyleProps {
  colours: ReturnType<typeof tokens>;
}

export interface CustomEventProps {
  event: CalendarEvent;
}

export interface EventStyleProps {
  event: CalendarEvent;
}

export interface DialogContentProps {
  selectedEvent: CalendarEvent;
  timezone: string;
}

export interface DialogActionProps {
  selectedEvent: CalendarEvent;
  handleCloseDialog: () => void;
  handleRSVP: (eventId: number, isAttending: boolean) => void;
  rsvpLoading: boolean;
  styleProps: StyleProps;
}

export interface CalendarHeaderProps {
  timezone: string;
  fetchEvents: () => void;
  loading: boolean;
  styleProps: StyleProps;
}

export interface AlertMessageProps {
  error: string | null;
  onClear: () => void;
}

export interface CalendarContainerProps {
  events: CalendarEvent[];
  handleSelectEvent: (event: CalendarEvent) => void;
  eventStyleGetter: (event: CalendarEvent) => { style: React.CSSProperties };
  CustomEvent: React.FC<CustomEventProps>;
}

export interface EventDialogProps {
  openDialog: boolean;
  handleCloseDialog: () => void;
  selectedEvent: CalendarEvent | null;
  handleRSVP: (eventId: number, isAttending: boolean) => void;
  rsvpLoading: boolean;
  timezone: string;
  styleProps: StyleProps;
}

export interface NoEventsMessageProps {
  styleProps: StyleProps;
}

export interface EventDateTimeInfoProps {
  start: Date;
  end: Date;
  timezone: string;
}

export interface EventLocationInfoProps {
  location: string;
}

export interface EventSocietyInfoProps {
  societyName: string;
}

export interface EventDescriptionInfoProps {
  description: string;
}

export interface EventDialogTitleProps {
  selectedEvent: CalendarEvent;
  eventStyleGetter: (event: CalendarEvent) => { style: React.CSSProperties };
}

export interface LoadingIndicatorProps {
  colours: ReturnType<typeof tokens>;
}