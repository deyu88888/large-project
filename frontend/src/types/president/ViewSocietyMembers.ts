export interface Society {
  id: number;
  name: string;
  president?: { id: number };
  vice_president?: { id: number };
  event_manager?: { id: number };
  [key: string]: any;
}