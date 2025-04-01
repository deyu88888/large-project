import { GridColDef } from "@mui/x-data-grid";
import { tokens } from "../../theme/theme";
import { Student } from "../../types";

export interface StudentListState {
  students: Student[];
  loading: boolean;
}

export interface DialogState {
  open: boolean;
  selectedStudent: Student | null;
  reason: string;
}

export interface ActionButtonsProps {
  studentId: number | string;
  student: Student;
  onView: (id: string) => void;
  onDelete: (student: Student) => void;
}

export interface DeleteDialogProps {
  dialogState: DialogState;
  onClose: () => void;
  onReasonChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onConfirm: () => void;
}

export interface DataGridContainerProps {
  students: Student[];
  columns: GridColDef[];
  loading: boolean;
  colors: ReturnType<typeof tokens>;
  drawer: boolean;
}

export interface PageTitleProps {
  title: string;
  colors: ReturnType<typeof tokens>;
}

export interface PresidentCellProps {
  isPresident: boolean;
  presidentOf: string[] | string | null;
}

export interface BooleanCellProps {
  value: boolean;
}

export interface NotificationState {
  open: boolean;
  message: string;
  severity: "success" | "error" | "info" | "warning";
}