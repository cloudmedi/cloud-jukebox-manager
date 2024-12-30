import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { PlaylistFormValues } from "../PlaylistForm";
import { Card, CardContent } from "@/components/ui/card";
import { ImagePlus, Image as ImageIcon } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ArtworkUploadProps {
  form: UseFormReturn<PlaylistFormValues>;
}

export const ArtworkUpload = ({ form }: ArtworkUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const artwork = form.watch("artwork");

  useEffect(() => {
    if (artwork && artwork.length > 0) {
      const url = URL.createObjectURL(artwork[0]);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [artwork]);

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
      console.log("Upload button clicked, triggering file input");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("File selection started");
    const file = e.target.files?.[0];
    if (!file) {
      console.log("No file selected");
      return;
    }

    // Check file type
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      console.log("Invalid file type:", file.type);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Lütfen sadece JPG, PNG veya WEBP formatında dosya yükleyin.",
      });
      return;
    }

    // Check file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.log("File too large:", file.size);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Dosya boyutu 5MB'dan küçük olmalıdır.",
      });
      return;
    }

    try {
      console.log("Setting form value for artwork");
      form.setValue("artwork", e.target.files as FileList, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });

      toast({
        title: "Başarılı",
        description: "Kapak resmi başarıyla yüklendi.",
      });
      
      console.log("Artwork upload successful");
    } catch (error) {
      console.error('Artwork upload error:', error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Kapak resmi yüklenirken bir hata oluştu.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-2 border-b">
        <ImageIcon className="h-5 w-5" />
        <h2 className="text-lg font-semibold">Kapak Resmi</h2>
      </div>

      <FormField
        control={form.control}
        name="artwork"
        render={() => (
          <FormItem>
            <FormControl>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-border">
                        {previewUrl ? (
                          <img
                            src={previewUrl}
                            alt="Kapak resmi önizleme"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-muted">
                            <ImageIcon className="h-16 w-16 text-muted-foreground/25" />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex flex-col justify-center space-y-4">
                    <Button 
                      type="button"
                      variant="outline" 
                      onClick={handleUploadClick}
                      className="w-full"
                    >
                      <ImagePlus className="mr-2 h-5 w-5" />
                      {previewUrl ? "Resmi Değiştir" : "Kapak Resmi Seç"}
                    </Button>
                    <FormDescription>
                      PNG, JPG veya WEBP formatında, maksimum 5MB boyutunda bir resim seçin
                    </FormDescription>
                  </div>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};