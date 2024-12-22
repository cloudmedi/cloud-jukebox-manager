import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";
import { PlaylistFormValues } from "../PlaylistForm";
import { Music } from "lucide-react";

interface BasicInfoFormProps {
  form: UseFormReturn<PlaylistFormValues>;
}

export const BasicInfoForm = ({ form }: BasicInfoFormProps) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-2 border-b">
        <Music className="h-5 w-5" />
        <h2 className="text-lg font-semibold">Temel Bilgiler</h2>
      </div>

      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Playlist Adı</FormLabel>
            <FormControl>
              <Input placeholder="Örn: En Sevdiğim Şarkılar" {...field} />
            </FormControl>
            <FormDescription>
              Playlistiniz için benzersiz bir isim seçin
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Açıklama</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Playlist hakkında kısa bir açıklama yazın..."
                className="resize-none"
                {...field}
              />
            </FormControl>
            <FormDescription>
              İsteğe bağlı olarak playlistiniz için bir açıklama ekleyebilirsiniz
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};