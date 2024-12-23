import { z } from "zod";

export const scheduleFormSchema = z.object({
  playlist: z.string({
    required_error: "Playlist seçimi zorunludur",
  }),
  startDate: z.date({
    required_error: "Başlangıç tarihi zorunludur",
  }),
  endDate: z.date({
    required_error: "Bitiş tarihi zorunludur",
  }),
  repeatType: z.enum(["once", "daily", "weekly", "monthly"], {
    required_error: "Tekrar tipi zorunludur",
  }),
  targets: z.object({
    devices: z.array(z.string()),
    groups: z.array(z.string()),
  })
  .refine((data) => data.devices.length > 0 || data.groups.length > 0, {
    message: "En az bir cihaz veya grup seçilmelidir",
  }),
}).refine((data) => {
  return data.endDate > data.startDate;
}, {
  message: "Bitiş tarihi başlangıç tarihinden sonra olmalıdır",
  path: ["endDate"], // This tells Zod to show the error on the endDate field
});