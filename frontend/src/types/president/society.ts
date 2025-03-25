export interface Society {
  id: number;
  name: string;
  [key: string]: any;
}

export interface SocietyData {
  id?: number;
  name: string;
  category: string;
  social_media_links: Record<string, string>;
  membership_requirements: string;
  upcoming_projects_or_plans: string;
  description: string;
  tags: string[];
  icon?: string | File | null;
}

export type FilterType = "upcoming" | "previous" | "pending";

export interface FilterOption {
  label: string;
  value: FilterType;
  color: string;
}