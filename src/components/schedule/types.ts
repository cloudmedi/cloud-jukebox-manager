export interface ScheduleFormData {
  playlist: string;
  startDate: Date;
  endDate: Date;
  repeatType: "once" | "daily" | "weekly" | "monthly";
  targets: {
    devices: string[];
    groups: string[];
  };
}