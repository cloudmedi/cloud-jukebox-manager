export interface Device {
  _id: string;
  name: string;
  location?: string;
  token: string;
  isOnline: boolean;
}

export interface DeviceGroup {
  _id: string;
  name: string;
  description?: string;
  devices: string[];
  status: 'active' | 'inactive';
}

export interface AnnouncementFormData {
  title: string;
  content: string;
  startDate: Date;
  endDate: Date;
  scheduleType: 'songs' | 'minutes' | 'specific';
  songInterval?: number;
  minuteInterval?: number;
  specificTimes?: string[];
  targetDevices: string[];
  targetGroups: string[];
}