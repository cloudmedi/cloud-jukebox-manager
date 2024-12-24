import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { BasicInfo } from "./form/BasicInfo";
import { ScheduleSettings } from "./form/ScheduleSettings";
import { TargetSelection } from "./form/TargetSelection";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const formSchema = z.object({
  title: z.string().min(1, "Başlık zorunludur"),
  content: z.string().min(1, "İçerik zorunludur"),
  audioFile: z.any(),
  duration: z.number(),
  startDate: z.date(),
  endDate: z.date(),
  scheduleType: z.enum(["songs", "minutes", "specific"]),
  songInterval: z.number().optional(),
  minuteInterval: z.number().optional(),
  specificTimes: z.array(z.string()),
  immediateInterrupt: z.boolean(),
  targetDevices: z.array(z.string()),
  targetGroups: z.array(z.string())
});

export type AnnouncementFormData = z.infer<typeof formSchema>;

interface AnnouncementFormProps {
  defaultValues?: Partial<AnnouncementFormData>;
  onSubmit: (data: AnnouncementFormData) => void;
  onSuccess?: () => void;
  isSubmitting?: boolean;
}

export const AnnouncementForm = ({
  defaultValues,
  onSubmit,
  onSuccess,
  isSubmitting = false
}: AnnouncementFormProps) => {
  const form = useForm<AnnouncementFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
      audioFile: null,
      duration: 0,
      startDate: new Date(),
      endDate: new Date(),
      scheduleType: "songs",
      songInterval: 1,
      minuteInterval: 1,
      specificTimes: [],
      immediateInterrupt: false,
      targetDevices: [],
      targetGroups: [],
      ...defaultValues
    }
  });

  const handleSubmit = async (data: AnnouncementFormData) => {
    try {
      await onSubmit(data);
      toast.success("Anons başarıyla kaydedildi");
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast.error("Anons kaydedilirken bir hata oluştu");
      console.error("Form submission error:", error);
    }
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <BasicInfo />
        <ScheduleSettings />
        <TargetSelection />
        
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
};