export enum NotificationCategory {
  AttendanceRequired = 1,
  RosterReady = 2,
  TeamNews = 3,
  Goalies = 4,
  Birthdays = 5,
  AppUpdates = 6,
}

export interface NotificationDto {
  id: string;
  type: number;
  category: NotificationCategory;
  title: string;
  body: string;
  url?: string | null;
  isRead: boolean;
  createdAt: string;
  readAt?: string | null;
  deliveredAt?: string | null;
}

export interface NotificationsListDto {
  items: NotificationDto[];
  unreadCount: number;
}

export interface NotificationPreferencesDto {
  attendanceRequiredEnabled: boolean;
  rosterReadyEnabled: boolean;
  teamNewsEnabled: boolean;
  goaliesEnabled: boolean;
  birthdaysEnabled: boolean;
  appUpdatesEnabled: boolean;
}
