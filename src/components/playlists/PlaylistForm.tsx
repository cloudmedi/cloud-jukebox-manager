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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Music } from "lucide-react";

const MAX_FILE_SIZE = 5000000; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const playlistSchema = z.object({
  name: z.string().min(1, "Playlist adı gereklidir").max(100, "Playlist adı çok uzun"),
  description: z.string().max(500, "Açıklama çok uzun").optional(),
  songs: z.array(z.string()).default([]),
  artwork: z.instanceof(FileList)
    .refine((files) => files?.length === 1, "Kapak resmi gereklidir")
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, "Maksimum dosya boyutu 5MB")
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      "Sadece .jpg, .jpeg, .png ve .webp formatları kabul edilir"
    )
    .optional(),
  isShuffled: z.boolean().default(false),
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

  const { data: songs = [], isLoading: isSongsLoading } = useQuery({
    queryKey: ["songs"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/songs");
      if (!response.ok) throw new Error("Şarkılar yüklenemedi");
      return response.json();
    },
  });

  const form = useForm<PlaylistFormValues>({
    resolver: zodResolver(playlistSchema),
    defaultValues: initialData || {
      name: "",
      description: "",
      songs: [],
      artwork: undefined,
      isShuffled: false,
    },
  });

  const handleSubmit = async (data: PlaylistFormValues) => {
    try {
      const formData = new FormData();
      formData.append("name", data.name);
      if (data.description) formData.append("description", data.description);
      data.songs.forEach(songId => formData.append("songs[]", songId));
      if (data.artwork?.[0]) formData.append("artwork", data.artwork[0]);
      formData.append("isShuffled", String(data.isShuffled));
      formData.append("createdBy", "system");

      const response = await fetch("http://localhost:5000/api/playlists", {
        method: isEditing ? "PATCH" : "POST",
        body: formData,
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

        <FormField
          control={form.control}
          name="artwork"
          render={({ field: { onChange, value, ...field } }) => (
            <FormItem>
              <FormLabel>Kapak Resmi (300x300)</FormLabel>
              <FormControl>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Input
                    type="file"
                    accept={ACCEPTED_IMAGE_TYPES.join(",")}
                    onChange={(e) => {
                      onChange(e.target.files);
                    }}
                    {...field}
                  />
                </div>
              </FormControl>
              <p className="text-sm text-muted-foreground">
                PNG, JPG veya WEBP. Maksimum 5MB.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="songs"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Şarkılar</FormLabel>
              <ScrollArea className="h-[200px] border rounded-md p-4">
                {isSongsLoading ? (
                  <div>Şarkılar yükleniyor...</div>
                ) : (
                  <div className="space-y-2">
                    {songs.map((song: any) => (
                      <div key={song._id} className="flex items-center space-x-2">
                        <Checkbox
                          checked={field.value.includes(song._id)}
                          onCheckedChange={(checked) => {
                            const newValue = checked
                              ? [...field.value, song._id]
                              : field.value.filter((id) => id !== song._id);
                            field.onChange(newValue);
                          }}
                        />
                        <div className="flex items-center gap-2">
                          <Music className="h-4 w-4 text-muted-foreground" />
                          <span>{song.name}</span>
                          <span className="text-sm text-muted-foreground">
                            - {song.artist}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isShuffled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Karışık Çalma</FormLabel>
                <div className="text-sm text-muted-foreground">
                  Şarkıları rastgele sırayla çal
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
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