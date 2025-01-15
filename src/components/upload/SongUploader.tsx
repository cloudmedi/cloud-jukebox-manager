import { useState, useCallback } from "react";
import { Upload, Music, X, FileMusic, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface SelectedFile {
  file: File;
  id: string;
  status: 'valid' | 'invalid';
}

const SongUploader = ({ onUploadComplete }: { onUploadComplete: () => void }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const validateFile = (file: File): 'valid' | 'invalid' => {
    return file.type.startsWith('audio/') ? 'valid' : 'invalid';
  };

  const handleFiles = (files: FileList | File[]) => {
    const newFiles: SelectedFile[] = Array.from(files)
      .map(file => ({
        file,
        id: Math.random().toString(36).substring(7),
        status: validateFile(file)
      }));

    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    handleFiles(files);
    event.target.value = '';
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  }, []);

  const removeFile = (id: string) => {
    setSelectedFiles(prev => prev.filter(file => file.id !== id));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setProgress(0);

    const totalFiles = selectedFiles.length;
    let uploadedFiles = 0;
    let failedUploads = 0;

    for (const { file } of selectedFiles) {
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

    if (uploadedFiles > 0) {
      toast({
        title: "Yükleme Tamamlandı",
        description: `${uploadedFiles} şarkı başarıyla yüklendi${failedUploads > 0 ? `, ${failedUploads} şarkı yüklenemedi` : ''}.`,
        duration: 10000,
      });
      onUploadComplete();
      setSelectedFiles([]); // Clear selected files after successful upload
    } else if (failedUploads > 0) {
      toast({
        variant: "destructive",
        title: "Yükleme Başarısız",
        description: "Hiçbir şarkı yüklenemedi.",
        duration: 10000,
      });
    }
    
    setUploading(false);
    setProgress(0);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div 
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center space-y-4 transition-colors",
        isDragging ? "border-primary bg-primary/5" : "border-border",
        "outline-none"
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      tabIndex={0}
    >
      <div className="flex flex-col items-center justify-center gap-2">
        <div className="bg-primary/10 p-4 rounded-full">
          <Music className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Şarkı Yükle</h3>
          <p className="text-sm text-muted-foreground">
            MP3 dosyalarını sürükleyip bırakabilir veya seçebilirsiniz
          </p>
        </div>
      </div>

      <div className="flex justify-center gap-2">
        <Button
          variant="outline"
          disabled={uploading}
          className="relative"
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          <Upload className="mr-2 h-4 w-4" />
          Dosya Seç
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
        {selectedFiles.length > 0 && (
          <Button
            onClick={handleUpload}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Yükleniyor...
              </>
            ) : (
              'Yüklemeyi Başlat'
            )}
          </Button>
        )}
      </div>

      {selectedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="text-sm font-medium">
            Seçilen Dosyalar:
            {uploading && (
              <span className="ml-2 text-muted-foreground inline-flex items-center">
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                Yükleniyor...
              </span>
            )}
          </div>
          <div className="max-h-60 overflow-y-auto">
            {selectedFiles.map(({ file, id, status }) => (
              <div
                key={id}
                className={cn(
                  "flex items-center justify-between p-2 rounded-md mb-2 transition-all",
                  "hover:bg-secondary/30 cursor-default",
                  status === 'valid' ? 'bg-secondary/20' : 'bg-destructive/20'
                )}
              >
                <div className="flex items-center gap-2">
                  <FileMusic className={cn(
                    "h-4 w-4",
                    status === 'valid' ? 'text-primary' : 'text-destructive'
                  )} />
                  <div className="text-sm">
                    <div className="font-medium">{file.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                      {status === 'invalid' && (
                        <span className="text-destructive ml-2">
                          Desteklenmeyen dosya türü
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => removeFile(id)}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {uploading && (
        <div className="space-y-2">
          <div className="relative">
            <Progress value={progress} className="w-full" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Yükleniyor... {progress}%
          </p>
        </div>
      )}
    </div>
  );
};

export default SongUploader;