import { GridColDef } from "@mui/x-data-grid";
import { tokens } from "../../theme/theme";
import { Society } from '../../types';

export interface SocietyDialogState {
  open: boolean;
  reason: string;
  selectedSociety: Society | null;
}

export interface ActionButtonsProps {
  societyId: string | number;
  onView: (id: string) => void;
  onDelete: (society: Society) => void;
  society: Society;
}

export interface DataGridContainerProps {
  societies: Society[];
  columns: GridColDef[];
  colors: ReturnType<typeof tokens>;
  drawer: boolean;
}

export interface DeleteDialogProps {
  state: SocietyDialogState;
  onClose: () => void;
  onReasonChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onConfirm: () => void;
}

export interface PresidentCellProps {
  president: {
    first_name: string;
    last_name: string;
  } | null;
}

export interface MembersCellProps {
  members: any[] | null;
}