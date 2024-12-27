import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { DialogTitle } from "@/components/ui/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { formSchema, FormData } from "./form/deviceFormSchema";
import { useTokenValidation } from "./form/useTokenValidation";
import { DeviceFormFields } from "./form/DeviceFormFields";
import { DeviceInfoDisplay } from "./form/DeviceInfoDisplay";

interface DeviceFormProps {
  onSuccess?: () => void;
}

const DeviceForm = ({ onSuccess }: DeviceFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { deviceInfo, validateToken } = useTokenValidation();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      token: "",
      location: "",
      volume: 50,
    },
  });

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

  const handleTokenChange = async (token: string) => {
    try {
      await validateToken(token);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Geçersiz Token",
        description: "Token geçersiz veya daha önce kullanılmış.",
        duration: 10000,
      });
    }
  };

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
          <DeviceFormFields 
            form={form} 
            onTokenChange={handleTokenChange}
            isSubmitting={isSubmitting}
          />
          
          <DeviceInfoDisplay deviceInfo={deviceInfo} />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Ekleniyor..." : "Cihaz Ekle"}
          </Button>
        </form>
      </Form>
    </>
  );
};

export default DeviceForm;