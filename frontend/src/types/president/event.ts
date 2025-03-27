import { ExtraModule } from "../../components/SortableItem";

export interface Event {
  id: number;
  title: string;
  date: string;
  start_time: string;
  status: string;
  hosted_by: number;
  main_description: string;
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

export interface RouteParams extends Record<string, string | undefined> {
  society_id?: string;
  event_id?: string;
}

export interface EventData {
  title: string;
  main_description: string;
  date: string;
  start_time: string;
  duration: string;
  location: string;
  max_capacity: number;
  cover_image_url?: string;
  cover_image_file?: File | null;
  extra_modules: ExtraModule[];
  participant_modules: ExtraModule[];
  is_participant: boolean;
  is_member: boolean;
  event_id: number;
  hosted_by: number;
  current_attendees: any[];
}