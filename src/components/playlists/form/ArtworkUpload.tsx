import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { PlaylistFormValues } from "../PlaylistForm";
import { Card, CardContent } from "@/components/ui/card";
import { ImageIcon } from "lucide-react";
import { useRef } from "react";

interface ArtworkUploadProps {
  form: UseFormReturn<PlaylistFormValues>;
}

export const ArtworkUpload = ({ form }: ArtworkUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrl = form.watch("artwork") && form.watch("artwork")[0] 
    ? URL.createObjectURL(form.watch("artwork")[0])
    : null;

  const handleCardClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <FormField
      control={form.control}
      name="artwork"
      render={({ field: { onChange, value, ...field } }) => (
        <FormItem>
          <FormLabel>Kapak Resmi (300x300)</FormLabel>
          <FormControl>
            <Card 
              className="w-full max-w-sm cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={handleCardClick}
            >
              <CardContent className="p-4">
                <div className="relative aspect-square w-full overflow-hidden rounded-lg border-2 border-dashed border-muted-foreground/25">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Kapak resmi önizleme"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ImageIcon className="h-16 w-16 text-muted-foreground/25" />
                    </div>
                  )}
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      onChange(e.target.files);
                    }}
                    {...field}
                  />
                </div>
              </CardContent>
            </Card>
          </FormControl>
          <p className="text-sm text-muted-foreground mt-2">
            PNG, JPG veya WEBP. Maksimum 5MB.
          </p>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};