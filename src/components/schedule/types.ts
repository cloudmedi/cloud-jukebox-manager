import { z } from "zod";

export interface ScheduleFormData {
  name: string;
  playlist: string;
  startDate: Date;
  endDate: Date;
  repeatType: "once" | "daily" | "weekly" | "monthly";
  targets: {
    devices: string[];
    groups: string[];
  };
}

export const scheduleFormSchema = z.object({
  playlist: z.string().min(1, "Playlist seçimi zorunludur"),
  startDate: z.date({
    required_error: "Başlangıç tarihi zorunludur",
  }),
  endDate: z.date({
    required_error: "Bitiş tarihi zorunludur",
  }),
  repeatType: z.enum(["once", "daily", "weekly", "monthly"]),
  targetDevices: z.array(z.string()),
  targetGroups: z.array(z.string())
});

export type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;