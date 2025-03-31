import { ReactNode } from "react";

export interface TabPanelProps {
  children: ReactNode;
  value: number;
  index: number;
}

export interface TabConfig {
  label: string;
  component: ReactNode;
}

export interface TabAccessibilityProps {
  id: string;
  'aria-controls': string;
}

export interface TabsContainerProps {
  activeTab: number;
  onTabChange: (event: React.SyntheticEvent, newValue: number) => void;
  tabs: TabConfig[];
}

export interface TabPanelsProps {
  activeTab: number;
  tabs: TabConfig[];
}

export interface HeaderProps {
  colors: any;
}