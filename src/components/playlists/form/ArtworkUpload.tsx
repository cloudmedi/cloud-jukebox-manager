import { FormField, FormItem, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { PlaylistFormValues } from "../PlaylistForm";
import { Card, CardContent } from "@/components/ui/card";
import { ImagePlus, Image as ImageIcon } from "lucide-react";
import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface ArtworkUploadProps {
  form: UseFormReturn<PlaylistFormValues>;
}

export const ArtworkUpload = ({ form }: ArtworkUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const artwork = form.watch("artwork");
  
  const previewUrl = artwork && artwork.length > 0
    ? URL.createObjectURL(artwork[0])
    : null;

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
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
        render={({ field: { onChange, value, ...field } }) => (
          <FormItem>
            <FormControl>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="overflow-hidden">
                    <CardContent className="p-4">
                      <div 
                        className="relative aspect-square w-full overflow-hidden rounded-lg border border-border cursor-pointer"
                        onClick={handleUploadClick}
                      >
                        {previewUrl ? (
                          <img
                            src={previewUrl}
                            alt="Kapak resmi önizleme"
                            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-muted hover:bg-muted/80 transition-colors">
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
                
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files?.length) {
                      onChange(files);
                    }
                  }}
                  {...field}
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