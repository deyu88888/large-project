export interface RoleOption {
  key: string;
  label: string;
}

export interface RouteParams {
  society_id: string;
  student_id: string;
}

export interface StudentIdParam {
  student_id: string;
}

export interface ManageSocietyEventsParams {
  society_id: string;
  filter?: "upcoming" | "previous" | "pending";
}

export interface SocietyIdParams {
  society_id: string;
}