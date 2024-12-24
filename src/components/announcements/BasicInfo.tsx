import { useState } from "react";
import { FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

interface BasicInfoProps {
  form: UseFormReturn<any>;
}

export const BasicInfo = ({ form }: BasicInfoProps) => {
  const [audioFile, setAudioFile] = useState<File | null>(null);

  const handleAudioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("audio/")) {
        toast.error("Lütfen geçerli bir ses dosyası seçin");
        return;
      }

      const audio = new Audio();
      audio.src = URL.createObjectURL(file);
      
      audio.onloadedmetadata = () => {
        setAudioFile(file);
        form.setValue("audioFile", file);
        form.setValue("duration", Math.ceil(audio.duration));
        toast.success("Ses dosyası yüklendi");
      };

      audio.onerror = () => {
        toast.error("Ses dosyası yüklenirken hata oluştu");
      };
    }
  };

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Başlık</FormLabel>
            <Input {...field} placeholder="Anons başlığı" />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="content"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Açıklama</FormLabel>
            <Textarea {...field} placeholder="Anons açıklaması" />
          </FormItem>
        )}
      />

      <FormItem>
        <FormLabel>Ses Dosyası</FormLabel>
        <div className="border-2 border-dashed rounded-lg p-6">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="bg-primary/10 p-4 rounded-full">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            
            {audioFile ? (
              <div className="text-center">
                <p className="font-medium">{audioFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  Süre: {Math.floor(form.getValues("duration") / 60)}:
                  {String(form.getValues("duration") % 60).padStart(2, "0")}
                </p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  MP3 formatında ses dosyası yükleyin
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-2"
                  onClick={() => document.getElementById("audioFile")?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Dosya Seç
                </Button>
              </div>
            )}
          </div>

          <input
            id="audioFile"
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleAudioUpload}
          />
        </div>
      </FormItem>
    </div>
  );
};