import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { PlaylistFormValues } from "../PlaylistForm";
import { Card, CardContent } from "@/components/ui/card";
import { ImageIcon } from "lucide-react";
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
    <FormField
      control={form.control}
      name="artwork"
      render={({ field: { onChange, value, ...field } }) => (
        <FormItem>
          <FormLabel>Kapak Resmi</FormLabel>
          <FormControl>
            <div className="space-y-4">
              <Button 
                type="button"
                variant="outline" 
                onClick={handleUploadClick}
                className="w-full"
              >
                <ImageIcon className="mr-2 h-4 w-4" />
                Kapak Resmi Seç
              </Button>
              
              <Card className="w-full overflow-hidden">
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
  );
};