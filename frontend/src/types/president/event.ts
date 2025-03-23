export interface Event {
  id: number;
  title: string;
  date: string;
  start_time: string;
  status: string;
  hosted_by: number;
  description: string;
  location: string;
  duration: string;
  max_capacity: number;
  current_attendees: number[];
}

export interface EventDetail {
  id: number;
  title: string;
  description: string;
  location: string;
  date: string;
  start_time: string;
  duration: string;
  status: string;
}