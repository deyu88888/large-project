import { ReactNode } from "react";
import { tokens } from "../../theme/theme";

export interface TabPanelProps {
  children: ReactNode;
  value: number;
  index: number;
}

export interface TabConfig {
  label: string;
  component: ReactNode;
  ariaLabel?: string;
}

export interface StorageOperations {
  getActiveTab: () => number;
  setActiveTab: (value: number) => void;
}

export interface ReportTabsProps {
  tabs: TabConfig[];
  activeTabIndex: number;
  handleTabChange: (event: React.SyntheticEvent, newValue: number) => void;
}

export interface TabPanelContainerProps {
  tabs: TabConfig[];
  activeTabIndex: number;
}

export interface PageTitleProps {
  colors: ReturnType<typeof tokens>;
}