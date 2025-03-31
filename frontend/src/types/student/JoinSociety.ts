import { SocietyRecommendation } from "../../api";

export interface StyleProps {
  isLight: boolean;
  colours: any;
}

export interface CategoryGroup {
  [key: string]: SocietyRecommendation[];
}

export interface CardStyleProps extends StyleProps {
  joining: number | null;
}

export interface SocietyCardProps {
  recommendation: SocietyRecommendation;
  handleViewSociety: (societyId: number) => void;
  joining: number | null;
  joinSuccess: boolean;
  isLight: boolean;
  colours: any;
}

export interface CategoryViewProps {
  recommendations: SocietyRecommendation[];
  handleViewSociety: (societyId: number) => void;
  joining: number | null;
  joinSuccess: boolean;
  styleProps: StyleProps;
}

export interface AllSocietiesViewProps {
  recommendations: SocietyRecommendation[];
  handleViewSociety: (societyId: number) => void;
  joining: number | null;
  joinSuccess: boolean;
  styleProps: StyleProps;
}

export interface ViewToggleButtonsProps {
  viewByCategory: boolean;
  setViewByCategory: (value: boolean) => void;
  isLight: boolean;
  colours: any;
}

export interface PageHeaderProps {
  title: string;
  subtitle: string;
  colours: any;
}

export interface ErrorMessageProps {
  error: string;
  isLight: boolean;
  colours: any;
}

export interface LoadingStateProps {
  colours: any;
}

export interface EmptyStateProps {
  isLight: boolean;
  colours: any;
}