import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export const TokenField = ({ form, onValidateToken }: { form: any, onValidateToken: (token: string) => Promise<void> }) => {
  const { toast } = useToast();

  return (
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
              {...field}
              onChange={async (e) => {
                field.onChange(e);
                if (e.target.value.length === 6) {
                  try {
                    await onValidateToken(e.target.value);
                    toast({
                      title: "Token Doğrulandı",
                      description: "Token geçerli ve kullanılabilir.",
                    });
                  } catch (error) {
                    toast({
                      variant: "destructive",
                      title: "Geçersiz Token",
                      description: "Token geçersiz veya daha önce kullanılmış.",
                    });
                  }
                }
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};