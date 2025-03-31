import { ActivityLog } from "../../types";

export interface NotificationState {
  open: boolean;
  message: string;
  severity: "success" | "error" | "info" | "warning";
}

export interface ActivityLogListProps {}

export interface ProcessingState {
  id: number | null;
  isProcessing: boolean;
}

export interface ActionButtonsProps {
  row: ActivityLog;
  processing: ProcessingState;
  onUndo: (id: number) => void;
  onDelete: (log: ActivityLog) => void;
}

export interface ConfirmDeleteDialogProps {
  open: boolean;
  log: ActivityLog | null;
  processing: ProcessingState;
  onClose: () => void;
  onConfirm: () => void;
  colors: any;
}

export interface NotificationAlertProps {
  notification: NotificationState;
  onClose: () => void;
}