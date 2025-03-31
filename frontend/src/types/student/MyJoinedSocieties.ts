export interface Society {
    id: number;
    name: string;
    description: string;
    icon: string;
  }
  
  export interface StyleProps {
    isLight: boolean;
    colours: any;
  }
  
  export interface HeaderProps {
    styleProps: StyleProps;
  }
  
  export interface LoadingStateProps {
    styleProps: StyleProps;
  }
  
  export interface EmptyStateProps {
    styleProps: StyleProps;
  }
  
  export interface SocietyCardProps {
    society: Society;
    onViewSociety: (societyId: number) => void;
    styleProps: StyleProps;
  }
  
  export interface SocietyGridProps {
    societies: Society[];
    onViewSociety: (societyId: number) => void;
    styleProps: StyleProps;
  }
  
  export interface ContainerProps {
    children: React.ReactNode;
    styleProps: StyleProps;
  }
  
  export interface SocietyIconProps {
    name: string;
    iconUrl: string;
  }
  
  export interface ViewSocietyButtonProps {
    societyId: number;
    onViewSociety: (societyId: number) => void;
    styleProps: StyleProps;
  }
  
  export interface ContentSwitcherProps {
    loading: boolean;
    societies: Society[];
    onViewSociety: (societyId: number) => void;
    styleProps: StyleProps;
  }