import { EventData } from "../event/event";

export interface StyleProps {
  isLight: boolean;
  colours: any;
}

export interface HeaderProps {
  styleProps: StyleProps;
}

export interface LoadingStateProps {
  styleProps: StyleProps;
}

export interface EmptyStateProps {
  styleProps: StyleProps;
}

export interface EventsGridProps {
  events: EventData[];
  handleViewEvent: (eventId: number) => void;
  styleProps: StyleProps;
}

export interface MainContainerProps {
  children: React.ReactNode;
  styleProps: StyleProps;
}

export interface ContentSwitcherProps {
  loading: boolean;
  events: EventData[];
  handleViewEvent: (eventId: number) => void;
  styleProps: StyleProps;
}