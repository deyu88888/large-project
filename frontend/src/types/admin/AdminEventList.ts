import { GridColDef } from "@mui/x-data-grid";
import { EventData } from "../event/event";

export interface DeleteDialogProps {
  open: boolean;
  event: EventData | null;
  reason: string;
  onReasonChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
  isSubmitting: boolean;
}

export interface ActionButtonsProps {
  eventId: number;
  event: EventData;
  onView: (event: EventData) => void;
  onDelete: (event: EventData) => void;
}

export interface DataGridContainerProps {
  filteredEvents: EventData[];
  columns: GridColDef[];
  loading: boolean;
  colors: any;
}