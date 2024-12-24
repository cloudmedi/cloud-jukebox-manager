import { useState } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";

interface AudioUploaderProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
}

export const AudioUploader = ({ onFileSelect, selectedFile }: AudioUploaderProps) => {
  const [progress, setProgress] = useState(0);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("audio/")) {
        alert("Lütfen geçerli bir ses dosyası seçin");
        return;
      }

      // Ses dosyası süresini hesapla
      const audio = new Audio();
      audio.src = URL.createObjectURL(file);
      audio.onloadedmetadata = () => {
        const duration = Math.ceil(audio.duration);
        console.log("Ses dosyası süresi:", duration);
        onFileSelect(file);
      };
    }
  };

  return (
    <div className="space-y-4">
      <Label>Ses Dosyası</Label>
      <div className="border-2 border-dashed rounded-lg p-6">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="bg-primary/10 p-4 rounded-full">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          
          {selectedFile ? (
            <div className="flex items-center gap-2">
              <span className="text-sm">{selectedFile.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onFileSelect(null)}
              >
                <X className="h-4 w-4" />
              </Button>
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
          onChange={handleFileChange}
        />
      </div>

      {progress > 0 && progress < 100 && (
        <div className="space-y-2">
          <Progress value={progress} />
          <p className="text-sm text-muted-foreground text-center">
            Yükleniyor... {progress}%
          </p>
        </div>
      )}
    </div>
  );
};