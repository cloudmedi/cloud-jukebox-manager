export interface ScheduleFormData {
  name: string;
  playlist: string;
  startDate: Date;
  endDate: Date;
  repeatType: "once" | "daily" | "weekly" | "monthly";
  targets: {
    targetType: "device" | "group";
    devices: string[];
    groups: string[];
  };
}