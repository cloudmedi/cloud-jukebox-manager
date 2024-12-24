export interface AnnouncementFormData {
  title: string;
  content: string;
  audioFile?: File;
  duration: number;
  startDate: Date;
  endDate: Date;
  scheduleType: 'songs' | 'minutes' | 'specific';
  songInterval?: number;
  minuteInterval?: number;
  specificTimes?: string[];
  targets: {
    devices: string[];
    groups: string[];
  };
  createdBy: string;
}

export interface ScheduleFormData extends AnnouncementFormData {
  playlist?: string;
  repeatType?: string;
}