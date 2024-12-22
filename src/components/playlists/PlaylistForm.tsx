import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const playlistSchema = z.object({
  name: z.string().min(1, "Playlist adı gereklidir").max(100, "Playlist adı çok uzun"),
  description: z.string().max(500, "Açıklama çok uzun").optional(),
});

type PlaylistFormValues = z.infer<typeof playlistSchema>;

interface PlaylistFormProps {
  onSuccess?: () => void;
  initialData?: PlaylistFormValues;
  isEditing?: boolean;
}

export const PlaylistForm = ({ onSuccess, initialData, isEditing = false }: PlaylistFormProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<PlaylistFormValues>({
    resolver: zodResolver(playlistSchema),
    defaultValues: initialData || {
      name: "",
      description: "",
    },
  });

  const handleSubmit = async (data: PlaylistFormValues) => {
    try {
      const response = await fetch("http://localhost:5000/api/playlists", {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("İşlem başarısız oldu");
      }

      queryClient.invalidateQueries({ queryKey: ["playlists"] });
      
      toast({
        title: `Playlist ${isEditing ? "güncellendi" : "oluşturuldu"}`,
        description: "İşlem başarıyla tamamlandı",
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Bir hata oluştu. Lütfen tekrar deneyin.",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Playlist Adı</FormLabel>
              <FormControl>
                <Input placeholder="Yeni Playlist" {...field} />
              </FormControl>
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
                  placeholder="Playlist açıklaması..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          {isEditing ? "Güncelle" : "Oluştur"}
        </Button>
      </form>
    </Form>
  );
};