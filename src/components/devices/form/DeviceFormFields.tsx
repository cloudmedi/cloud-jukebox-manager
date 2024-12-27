import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { FormData } from "./deviceFormSchema";

interface DeviceFormFieldsProps {
  form: UseFormReturn<FormData>;
  onTokenChange: (token: string) => Promise<boolean>;
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
                placeholder="6 haneli token" 
                maxLength={6}
                disabled={isSubmitting}
                {...field} 
                onChange={async (e) => {
                  field.onChange(e);
                  if (e.target.value.length === 6) {
                    await onTokenChange(e.target.value);
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
              <Input placeholder="Örn: İstanbul" {...field} disabled={isSubmitting} />
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
                placeholder="50"
                disabled={isSubmitting}
                {...field}
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