export type FilterType = "upcoming" | "previous" | "pending" | "rejected";

export interface FilterOption {
  label: string;
  value: FilterType;
  color: string;
}

export interface ThemeStyles {
  backgroundColor: string;
  textColor: string;
  paperBackgroundColor: string;
  paperHoverBackgroundColor: string;
}