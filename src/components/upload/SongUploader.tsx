import { useState, useCallback } from "react";
import { Upload, Music, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const SongUploader = ({ onUploadComplete }: { onUploadComplete: () => void }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const validateFile = (file: File): boolean => {
    // Dosya tipi kontrolü
    if (!file.type.startsWith('audio/')) {
      toast({
        variant: "destructive",
        title: "Geçersiz dosya formatı",
        description: `${file.name} geçerli bir ses dosyası değil`,
      });
      return false;
    }

    // Boyut kontrolü (50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        variant: "destructive",
        title: "Dosya boyutu çok büyük",
        description: `${file.name} 50MB'dan küçük olmalıdır`,
      });
      return false;
    }

    return true;
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setProgress(0);

    const totalFiles = files.length;
    let uploadedFiles = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!validateFile(file)) {
        continue;
      }

      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('http://localhost:5000/api/songs/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`${file.name} yüklenirken bir hata oluştu`);
        }

        uploadedFiles++;
        setProgress(Math.round((uploadedFiles / totalFiles) * 100));
        
        toast({
          title: "Başarılı",
          description: `${file.name} başarıyla yüklendi`,
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Hata",
          description: error instanceof Error ? error.message : `${file.name} yüklenirken bir hata oluştu`,
        });
      }
    }

    if (uploadedFiles > 0) {
      onUploadComplete();
    }
    
    setUploading(false);
    setProgress(0);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const { files } = e.dataTransfer;
    handleUpload(files);
  }, []);

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center space-y-4 transition-colors",
        dragActive && "border-primary bg-primary/5",
        uploading && "opacity-50 cursor-not-allowed"
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center justify-center gap-2">
        <div className={cn(
          "bg-primary/10 p-4 rounded-full transition-transform",
          dragActive && "scale-110"
        )}>
          {uploading ? (
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          ) : (
            <Music className="h-8 w-8 text-primary" />
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold">Şarkı Yükle</h3>
          <p className="text-sm text-muted-foreground">
            Dosyaları sürükleyip bırakın veya seçin
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
            onChange={(e) => handleUpload(e.target.files)}
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