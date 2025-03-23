export interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number | string;
}

export interface NotificationCardProps {
  message: string;
  isRead: boolean;
}