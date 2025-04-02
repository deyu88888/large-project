export interface Society {
  id: number;
  name: string;
  description: string;
  society_members: number[];
  approved_by: number;
  status: string;
  category: string;
  social_media_links: SocialMediaLinks;
  showreel_images: ShowreelImage[];
  icon: string;
  tags: string[];
  vice_president: Member;
  event_manager: Member;
  president: Member;
}

export interface SocialMediaLinks {
  Facebook?: string;
  Instagram?: string;
  X?: string;
  [key: string]: string | undefined; // in case more platforms are added
}

export interface ShowreelImage {
  photo: string;
  caption: string;
}

export interface Member {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  role: string;
  following: any[]; // assuming you want to expand this later
  is_following: boolean;
  following_count: number;
  followers_count: number;
  is_super_admin: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  major: string;
  societies: any[]; // assuming placeholder for future data
  president_of: number | null;
  is_president: boolean;
  vice_president_of_society: number | null;
  is_vice_president: boolean;
  event_manager_of_society: number | null;
  is_event_manager: boolean;
  icon: string;
}
