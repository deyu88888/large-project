import { EventData } from "../event/event";
import React from "react";

export interface DeleteDialogProps {
  open: boolean;
  event: EventData | null;
  reason: string;
  onReasonChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export interface ActionButtonsProps {
  event: EventData;
  onView: (event: EventData) => void;
  onDelete: (event: EventData) => void;
}