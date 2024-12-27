import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface UploadFormProps {
  onSuccess?: () => void;
}

export function UploadForm({ onSuccess }: UploadFormProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      // Implement your upload logic here
      toast({
        title: "Başarılı",
        description: "Dosya başarıyla yüklendi",
      });
      onSuccess?.();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Dosya yüklenirken bir hata oluştu",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>Yeni Müzik Yükle</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <input
            type="file"
            accept="audio/*"
            multiple
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <Button type="submit" disabled={isUploading}>
          {isUploading ? "Yükleniyor..." : "Yükle"}
        </Button>
      </form>
    </div>
  );
}