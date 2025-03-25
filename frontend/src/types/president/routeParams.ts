export interface SocietyRouteParams {
  society_id: string;
}

export interface SocietyStudentRouteParams {
  society_id: string;
  student_id: string;
}

export interface SocietyEventRouteParams {
  society_id: string;
  event_id: string;
}

export interface StudentRouteParams {
  student_id: string;
}

export interface FilteredSocietyParams {
  society_id: string;
  filter?: "upcoming" | "previous" | "pending";
}

export interface ManageSocietyParams {
  society_id: string;
}