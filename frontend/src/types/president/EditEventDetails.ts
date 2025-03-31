export interface EventDataResponse {
  event?: {
    title?: string;
    main_description?: string;
    date?: string;
    start_time?: string;
    duration?: string;
    location?: string;
    max_capacity?: number;
    cover_image?: string;
    extra_modules?: any[];
    participant_modules?: any[];
  };
  admin_reason?: string;
  title?: string;
  main_description?: string;
  date?: string;
  start_time?: string;
  duration?: string;
  location?: string;
  max_capacity?: number;
  cover_image?: string;
  extra_modules?: any[];
  participant_modules?: any[];
}

export interface ModuleData {
  id?: string | number;
  type?: string;
  text_value?: string;
  file_value?: string;
  is_participant_only?: boolean;
}