import * as z from "zod";

export const formSchema = z.object({
  name: z.string().min(1, "Cihaz adı zorunludur"),
  token: z.string().length(6, "Token 6 haneli olmalıdır").regex(/^\d+$/, "Token sadece rakam içermelidir"),
  location: z.string().min(1, "Konum zorunludur"),
  volume: z.number().min(0).max(100).default(50),
});

export type FormData = z.infer<typeof formSchema>;