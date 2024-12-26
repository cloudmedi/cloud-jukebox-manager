import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { DialogTitle } from "@/components/ui/dialog";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { TokenField } from "./form/TokenField";
import { LocationField } from "./form/LocationField";

const formSchema = z.object({
  name: z.string().min(1, "Cihaz adı zorunludur"),
  token: z.string().length(6, "Token 6 haneli olmalıdır").regex(/^\d+$/, "Token sadece rakam içermelidir"),
  location: z.string().min(1, "Konum zorunludur"),
  volume: z.number().min(0).max(100).default(50),
});

type FormData = z.infer<typeof formSchema>;

interface DeviceFormProps {
  onSuccess?: () => void;
}

const DeviceForm = ({ onSuccess }: DeviceFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      token: "",
      location: "",
      volume: 50,
    },
  });

  const validateToken = async (token: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/tokens/validate/${token}`);
      if (!response.ok) {
        throw new Error("Geçersiz token");
      }
      const data = await response.json();
      setDeviceInfo(data.deviceInfo);
      return data;
    } catch (error) {
      setDeviceInfo(null);
      throw error;
    }
  };

  const createDevice = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch("http://localhost:5000/api/devices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Cihaz eklenirken bir hata oluştu");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      toast({
        title: "Başarılı!",
        description: "Cihaz başarıyla eklendi.",
      });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Hata!",
        description: error.message,
      });
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      await createDevice.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <DialogTitle className="text-xl font-semibold mb-4">
        Yeni Cihaz Ekle
      </DialogTitle>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cihaz Adı</FormLabel>
                <FormControl>
                  <Input placeholder="Örn: Mağaza-1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <TokenField form={form} onValidateToken={validateToken} />
          
          <LocationField form={form} />

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
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {deviceInfo && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Cihaz Bilgileri:</h3>
              <p>Platform: {deviceInfo.platform}</p>
              <p>İşlemci: {deviceInfo.cpus}</p>
              <p>Toplam Bellek: {deviceInfo.totalMemory}</p>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Ekleniyor..." : "Cihaz Ekle"}
          </Button>
        </form>
      </Form>
    </>
  );
};

export default DeviceForm;