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
  status: string;
}

export interface TransformedEvent {
  id: number;
  title: string;
  description: string;
  date: string;
  startTime: string;
  duration: string;
  location: string;
  hostedBy: number;
  societyName?: string;
  rsvp: boolean;
  status: string;
}