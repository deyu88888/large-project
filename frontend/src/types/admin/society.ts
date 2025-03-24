export interface DescriptionRequest {
  id: number;
  society: { id: number; name: string };
  requested_by: { id: number; username: string };
  new_description: string;
  created_at: string;
}