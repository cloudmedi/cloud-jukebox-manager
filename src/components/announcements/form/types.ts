export type FormSteps = "basic" | "schedule" | "targets";

export type ScheduleType = "songs" | "minutes" | "specific";

export interface AnnouncementFormData {
  title: string;
  content: string;
  audioFile: File | null;
  duration: number;
  startDate: Date | null;
  endDate: Date | null;
  scheduleType: ScheduleType;
  songInterval?: number;
  minuteInterval?: number;
  specificTimes: string[];
  immediateInterrupt: boolean;
  targetDevices: Array<string>;
  targetGroups: Array<string>;
}

export interface Device {
  _id: string;
  name: string;
  location?: string;
}

export interface Group {
  _id: string;
  name: string;
  devices?: string[];
}