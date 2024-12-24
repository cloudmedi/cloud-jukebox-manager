import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { UseFormReturn } from "react-hook-form";
import { AnnouncementFormData } from "../types/announcement";

interface AudioUploadProps {
  form: UseFormReturn<AnnouncementFormData>;
  uploading: boolean;
  progress: number;
  onFileSelect: (file: File) => void;
}

export const AudioUpload = ({ form, uploading, progress, onFileSelect }: AudioUploadProps) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Ses Dosyası
      </label>
      <div className="border-2 border-dashed rounded-lg p-8 text-center space-y-4">
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="bg-primary/10 p-4 rounded-full">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              MP3 formatında ses dosyası yükleyin
            </p>
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            onClick={() => document.getElementById("audioFile")?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? "Yükleniyor..." : "Dosya Seç"}
          </Button>
          <input
            id="audioFile"
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onFileSelect(file);
              }
            }}
          />
        </div>

        {uploading && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground">
              Yükleniyor... {progress}%
            </p>
          </div>
        )}
      </div>
    </div>
  );
};