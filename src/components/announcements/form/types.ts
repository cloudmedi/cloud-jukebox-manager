export type FormSteps = "basic" | "schedule" | "targets";

export interface AnnouncementFormData {
  title: string;
  content: string;
  audioFile: File | null;
  duration: number;
  startDate: Date | null;
  endDate: Date | null;
  scheduleType: "songs" | "minutes" | "specific";
  songInterval?: number;
  minuteInterval?: number;
  specificTimes?: string[];
  immediateInterrupt: boolean;
  targetDevices: string[];
  targetGroups: string[];
}