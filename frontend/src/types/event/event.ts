// src/types/event.ts
export interface ExtraModule {
  id: string;
  type: "description" | "image" | "file" | "subtitle";
  textValue?: string;
  fileValue?: File | string;
}

export interface RouteParams extends Record<string, string | undefined> {
  society_id?: string;
  event_id?: string;
}

export interface Attendee {
  id: number;
  first_name: string;
  icon?: string | null;
}

export interface Event {
  id: number;
  title: string;
  main_description: string;
  cover_image: string;
  date: string;
  start_time: string;
  duration: string;
  hosted_by: number;
  location: string;
  max_capacity: number;
  current_attendees: any[];
  extra_modules: any[];           // 后续可使用 mapModule 转换为 ExtraModule[]
  participant_modules: any[];     // 同上// Attendee 接口根据实际业务定义
  is_member: boolean;
  is_participant: boolean;
  status?: string;
  [key: string]: any;
}

export interface EventData {
  eventId: number;
  title: string;
  mainDescription: string;
  coverImageUrl?: string;
  coverImageFile?: File | null;
  date: string;
  startTime: string;
  duration: string;
  hostedBy: number;
  location: string;
  maxCapacity: number;
  currentAttendees: any[];
  extraModules: ExtraModule[];
  participantModules: ExtraModule[];
  isParticipant: boolean;
  isMember: boolean;
  adminReason?: string;
}

export interface EventFormInitialData {
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
}
