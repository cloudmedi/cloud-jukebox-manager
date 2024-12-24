import { useState, useRef } from "react";
import { FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Upload, Play, Pause, Volume2 } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BasicInfoProps {
  form: UseFormReturn<any>;
}

export const BasicInfo = ({ form }: BasicInfoProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioFile = form.watch("audioFile");

  const handleAudioUpload = (file: File) => {
    if (!file.type.startsWith("audio/")) {
      toast.error("Lütfen geçerli bir ses dosyası seçin");
      return;
    }

    const audio = new Audio();
    audio.src = URL.createObjectURL(file);
    
    audio.onloadedmetadata = () => {
      form.setValue("audioFile", file);
      form.setValue("duration", Math.ceil(audio.duration));
      audioRef.current = audio;
      toast.success("Ses dosyası yüklendi");
    };

    audio.onerror = () => {
      toast.error("Ses dosyası yüklenirken hata oluştu");
    };
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleAudioUpload(file);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
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

      <FormField
        control={form.control}
        name="audioFile"
        render={() => (
          <FormItem>
            <FormLabel>Ses Dosyası</FormLabel>
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-6 transition-colors",
                isDragging ? "border-primary bg-primary/10" : "border-border",
                audioFile ? "bg-accent/50" : ""
              )}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="bg-primary/10 p-4 rounded-full">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                
                {audioFile ? (
                  <div className="text-center space-y-2">
                    <p className="font-medium">{audioFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Süre: {Math.floor(form.getValues("duration") / 60)}:
                      {String(form.getValues("duration") % 60).padStart(2, "0")}
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={togglePlay}
                      >
                        {isPlaying ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Volume2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Ses dosyasını sürükleyip bırakın veya seçin
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
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAudioUpload(file);
                }}
              />
            </div>
          </FormItem>
        )}
      />
    </div>
  );
};