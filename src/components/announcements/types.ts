export interface Announcement {
  _id?: string;
  title: string;
  content: string;
  audioFile?: File;
  duration: number;
  schedule: {
    startDate: Date;
    endDate: Date;
    type: 'interval' | 'specific';
    interval?: number;
    specificTimes?: string[];
  };
  targets: {
    devices: string[];
    groups: string[];
  };
  status: 'active' | 'inactive' | 'completed';
}

export interface Device {
  _id: string;
  name: string;
  location?: string;
  isOnline: boolean;
}

export interface DeviceGroup {
  _id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
}