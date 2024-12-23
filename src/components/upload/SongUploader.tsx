import { useState, useCallback } from "react";
import { Upload, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";

const SongUploader = ({ onUploadComplete }: { onUploadComplete: () => void }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState(0);
  const { toast } = useToast();

  const uploadFile = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:5000/api/songs/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      console.log('Uploaded file:', data);
      return data;
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  }, []);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    setProgress(0);
    setTotalFiles(files.length);
    setUploadedFiles(0);

    const invalidFiles = files.filter(file => !file.type.startsWith('audio/'));
    if (invalidFiles.length > 0) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Lütfen sadece ses dosyaları seçin",
      });
      setUploading(false);
      return;
    }

    try {
      for (let i = 0; i < files.length; i++) {
        try {
          await uploadFile(files[i]);
          setUploadedFiles(prev => prev + 1);
          setProgress(((i + 1) / files.length) * 100);
        } catch (error) {
          console.error(`Error uploading ${files[i].name}:`, error);
          toast({
            variant: "destructive",
            title: "Yükleme Hatası",
            description: `${files[i].name} yüklenirken hata oluştu`,
          });
        }
      }

      toast({
        title: "Başarılı",
        description: `${uploadedFiles} dosya başarıyla yüklendi`,
      });
      
      onUploadComplete();
    } catch (error) {
      console.error('Bulk upload error:', error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Dosyalar yüklenirken bir hata oluştu",
      });
    } finally {
      setUploading(false);
      setProgress(0);
      setTotalFiles(0);
      setUploadedFiles(0);
    }
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
            MP3 formatında şarkılar yükleyebilirsiniz
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
            Yükleniyor... {uploadedFiles}/{totalFiles} dosya ({Math.round(progress)}%)
          </p>
        </div>
      )}
    </div>
  );
};

export default SongUploader;