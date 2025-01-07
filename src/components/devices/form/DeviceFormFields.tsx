import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { FormData } from "./deviceFormSchema";

interface DeviceFormFieldsProps {
  form: UseFormReturn<FormData>;
  onTokenChange: (token: string) => Promise<void>;
  isSubmitting: boolean;
}

export const DeviceFormFields = ({ form, onTokenChange, isSubmitting }: DeviceFormFieldsProps) => {
  return (
    <>
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Cihaz Adı</FormLabel>
            <FormControl>
              <Input placeholder="Örn: Mağaza-1" {...field} disabled={isSubmitting} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="token"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Token</FormLabel>
            <FormControl>
              <Input 
                placeholder="6 karakterli token (2-9 ve A-Z)" 
                maxLength={6}
                style={{ textTransform: 'uppercase' }}
                disabled={isSubmitting}
                {...field} 
                onChange={async (e) => {
                  // Girilen değeri büyük harfe çevir
                  const value = e.target.value.toUpperCase();
                  // Input değerini güncelle
                  e.target.value = value;
                  // Form state'ini güncelle
                  field.onChange(value);
                  // Token validasyonu
                  if (value.length === 6) {
                    await onTokenChange(value);
                  }
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="location"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Konum</FormLabel>
            <FormControl>
              <Input placeholder="Örn: Mağaza Giriş" {...field} disabled={isSubmitting} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="volume"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Ses Seviyesi</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                min={0} 
                max={100} 
                {...field} 
                disabled={isSubmitting}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};