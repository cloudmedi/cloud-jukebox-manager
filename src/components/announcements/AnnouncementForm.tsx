import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";

const AnnouncementForm = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    setUploading(true);
    setProgress(0);

    try {
      const response = await fetch("http://localhost:5000/api/announcements", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      toast({
        title: "Başarılı",
        description: "Anons başarıyla oluşturuldu",
      });

      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      e.currentTarget.reset();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Anons oluşturulurken bir hata oluştu",
      });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Başlık</Label>
        <Input id="title" name="title" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Açıklama</Label>
        <Textarea id="description" name="description" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="file">Ses Dosyası</Label>
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
              onClick={() => document.getElementById("file")?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              {uploading ? "Yükleniyor..." : "Dosya Seç"}
            </Button>
            <input
              id="file"
              name="file"
              type="file"
              accept="audio/*"
              className="hidden"
              required
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

      <Button type="submit" disabled={uploading}>
        Anons Oluştur
      </Button>
    </form>
  );
};

export default AnnouncementForm;