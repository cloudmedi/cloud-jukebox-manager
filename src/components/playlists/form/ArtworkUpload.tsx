import { FormField, FormItem, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { PlaylistFormValues } from "../PlaylistForm";
import { Image as ImageIcon } from "lucide-react";
import { useRef, useEffect } from "react";

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
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ImageIcon className="h-5 w-5" />
        <h2 className="text-lg font-medium">Kapak Resmi</h2>
      </div>

      <FormField
        control={form.control}
        name="artwork"
        render={({ field: { onChange, value, ...field } }) => (
          <FormItem>
            <FormControl>
              <div>
                <div 
                  className="relative aspect-square w-full max-w-[240px] overflow-hidden rounded-lg border-2 border-dashed border-muted-foreground/25 cursor-pointer transition-all duration-300 hover:border-primary/50 group"
                  onClick={handleUploadClick}
                >
                  {previewUrl ? (
                    <div className="relative w-full h-full group">
                      <img
                        src={previewUrl}
                        alt="Kapak resmi önizleme"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <p className="text-white text-sm">Resmi Değiştir</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col h-full items-center justify-center p-6 text-center gap-2 group-hover:bg-muted/50 transition-colors">
                      <ImageIcon className="h-12 w-12 text-muted-foreground/25" />
                      <p className="text-sm text-muted-foreground">
                        Kapak resmi yüklemek için tıklayın
                      </p>
                      <p className="text-xs text-muted-foreground/75">
                        PNG, JPG veya WEBP (max. 5MB)
                      </p>
                    </div>
                  )}
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
          </FormItem>
        )}
      />
    </div>
  );
};