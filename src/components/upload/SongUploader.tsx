import { useState } from "react";
import { Upload, Music } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!file.type.startsWith('audio/')) {
        toast({
          variant: "destructive",
          title: "Hata",
          description: `${file.name} geçerli bir ses dosyası değil`,
        });
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
        
        toast({
          title: "Başarılı",
          description: `${file.name} başarıyla yüklendi`,
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Hata",
          description: `${file.name} yüklenirken bir hata oluştu`,
        });
      }
    }

    if (uploadedFiles > 0) {
      onUploadComplete();
    }
    
    setUploading(false);
    setProgress(0);
  };

  return (
    <div className="border-2 border-dashed rounded-lg p-8 text-center space-y-4">
      <div className="flex flex-col items-center justify-center gap-2">
        <div className="bg-blue-100 p-4 rounded-full">
          <Music className="h-8 w-8 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Şarkı Yükle</h3>
          <p className="text-sm text-gray-500">
            Birden fazla MP3 dosyası seçebilirsiniz
          </p>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          disabled={uploading}
          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            uploading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
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
        </button>
      </div>

      {uploading && (
        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500">
            Yükleniyor... {progress}%
          </p>
        </div>
      )}
    </div>
  );
};

export default SongUploader;