import { EventData, ExtraModule } from "../types/event/event";
import { Society } from '../types';

const mapModule = (mod: any): ExtraModule => ({
  id: mod.id,
  type: mod.type,
  textValue: mod.text_value,
  fileValue: mod.file_value,
});

export const mapToEventData = (event: any): EventData => ({
  eventId: event.id,
  title: event.title || "",
  mainDescription: event.main_description || "",
  coverImageUrl: event.cover_image || "",
  coverImageFile: null,
  date: event.date || "",
  startTime: event.start_time || "",
  duration: event.duration || "",
  hostedBy: event.hosted_by || 0,
  location: event.location || "",
  maxCapacity: event.max_capacity || 0,
  currentAttendees: event.current_attendees || [],
  extraModules: Array.isArray(event.extra_modules)
    ? event.extra_modules.map(mapModule)
    : [],
  participantModules: Array.isArray(event.participant_modules)
    ? event.participant_modules.map(mapModule)
    : [],
  isParticipant: event.is_participant ?? false,
  isMember: event.is_member ?? false,
});

export const mapToEventRequestData = (data: any): EventData => {
  const event = data.event;
  return {
    eventId: event.id || null,
    title: event.title || "",
    mainDescription: event.main_description || "",
    coverImageUrl: event.cover_image || "",
    date: event.date || "",
    startTime: event.start_time || "",
    duration: event.duration || "",
    hostedBy: event.hosted_by || 0,
    location: event.location || "",
    maxCapacity: event.max_capacity || 0,
    currentAttendees: event.current_attendees || [],
    extraModules: Array.isArray(event.extra_modules)
      ? event.extra_modules.map(mapModule)
      : [],
    participantModules: Array.isArray(event.participant_modules)
      ? event.participant_modules.map(mapModule)
      : [],
    isParticipant: true,
    isMember: true,
    adminReason: data.admin_reason ?? "",
  };
};

export const mapSocietyRequestToSociety = (request: any): Society => ({
  id: request.id,
  name: request.name,
  description: request.description,
  category: request.category,
  icon: request.icon || null,
  social_media_links: request.social_media_links || {},
  tags: request.tags || [],
  president: request.president || {
    id: 0,
    first_name: "Pending",
    last_name: "",
    email: "pending@example.com"
  },
  society_members: [],
  approved_by: null,
  status: "Pending",
  timetable: "",
  membership_requirements: "",
  upcoming_projects_or_plans: "",
  leader: "",
  roles: []
});