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
  immediateInterrupt?: boolean;
  createdBy?: string;
}

export interface Device {
  _id: string;
  name: string;
  location?: string;
  isOnline: boolean;
  status?: string;
}

export interface DeviceGroup {
  _id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
}