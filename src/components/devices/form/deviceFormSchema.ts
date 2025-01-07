import * as z from "zod";

// Karışıklığa neden olabilecek karakterleri çıkardık:
// Çıkarılanlar: 0, O, 1, I, l
const ALLOWED_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export const formSchema = z.object({
  name: z.string().min(1, "Cihaz adı zorunludur"),
  token: z.string()
    .length(6, "Token 6 karakterli olmalıdır")
    .refine(
      (val) => val.split('').every(char => ALLOWED_CHARS.includes(char)),
      "Token sadece izin verilen karakterleri içermelidir (2-9 ve A-Z, 0,O,1,I,l hariç)"
    ),
  location: z.string().min(1, "Konum zorunludur"),
  volume: z.number().min(0).max(100).default(50),
});

export type FormData = z.infer<typeof formSchema>;