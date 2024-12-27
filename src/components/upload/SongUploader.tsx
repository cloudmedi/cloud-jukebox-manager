import { useState } from "react";
import { Upload, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

const SongUploader = ({ onUploadComplete }: { onUploadComplete: () => void }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setProgress(0);

    const totalFiles = files.length;
    let uploadedFiles = 0;
    let failedUploads = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!file.type.startsWith('audio/')) {
        failedUploads++;
        continue;
      }

      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('http://localhost:5000/api/songs/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error('Upload failed');

        uploadedFiles++;
        setProgress(Math.round((uploadedFiles / totalFiles) * 100));
        
      } catch (error) {
        failedUploads++;
      }
    }

    // Yükleme tamamlandığında tek bir bildirim göster
    if (uploadedFiles > 0) {
      toast({
        title: "Yükleme Tamamlandı",
        description: `${uploadedFiles} şarkı başarıyla yüklendi${failedUploads > 0 ? `, ${failedUploads} şarkı yüklenemedi` : ''}.`,
      });
      onUploadComplete();
    } else if (failedUploads > 0) {
      toast({
        variant: "destructive",
        title: "Yükleme Başarısız",
        description: "Hiçbir şarkı yüklenemedi.",
      });
    }
    
    setUploading(false);
    setProgress(0);
  };

  return (
    <div className="border-2 border-dashed rounded-lg p-8 text-center space-y-4">
      <div className="flex flex-col items-center justify-center gap-2">
        <div className="bg-primary/10 p-4 rounded-full">
          <Music className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Şarkı Yükle</h3>
          <p className="text-sm text-muted-foreground">
            Birden fazla MP3 dosyası seçebilirsiniz
          </p>
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          variant="outline"
          disabled={uploading}
          className="relative"
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          <Upload className="mr-2 h-4 w-4" />
          {uploading ? 'Yükleniyor...' : 'Dosya Seç'}
          <input
            id="file-upload"
            type="file"
            accept="audio/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </Button>
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
  );
};

export default SongUploader;