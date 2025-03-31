import { GridColDef } from "@mui/x-data-grid";
import { EventData } from "../event/event";
import { tokens } from "../../theme/theme";

export interface AlertState {
  open: boolean;
  message: string;
  severity: "success" | "error";
}

export interface ActionButtonsProps {
  id: number;
  event: EventData;
  onStatusChange: (id: number, status: "Approved" | "Rejected") => void;
  onView: (event: EventData) => void;
}

export interface EventNotificationProps {
  alert: AlertState;
  onClose: () => void;
}

export interface DataGridCustomProps {
  events: EventData[];
  columns: GridColDef[];
  drawer: boolean;
  colors: ReturnType<typeof tokens>;
}