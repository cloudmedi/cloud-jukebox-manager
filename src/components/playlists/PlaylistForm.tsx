import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { BasicInfoForm } from "./form/BasicInfoForm";
import { ArtworkUpload } from "./form/ArtworkUpload";
import { SongSelector } from "./form/SongSelector";
import { Save } from "lucide-react";
import { useSelectedSongsStore } from "@/store/selectedSongsStore";
import { useEffect } from "react";

const MAX_FILE_SIZE = 5000000;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const playlistSchema = z.object({
  name: z.string().min(1, "Playlist adı gereklidir").max(100, "Playlist adı çok uzun"),
  description: z.string().max(500, "Açıklama çok uzun").optional(),
  songs: z.array(z.string()).default([]),
  artwork: z
    .custom<FileList>()
    .optional()
    .nullable()
    .refine((files) => {
      if (!files) return true;
      return files.length === 0 || files.length === 1;
    }, "Bir adet kapak resmi seçin")
    .refine((files) => {
      if (!files) return true;
      return files.length === 0 || files[0].size <= MAX_FILE_SIZE;
    }, "Maksimum dosya boyutu 5MB")
    .refine((files) => {
      if (!files) return true;
      return files.length === 0 || ACCEPTED_IMAGE_TYPES.includes(files[0].type);
    }, "Sadece .jpg, .jpeg, .png ve .webp formatları kabul edilir"),
  isShuffled: z.boolean().default(false),
});

export type PlaylistFormValues = z.infer<typeof playlistSchema>;

interface PlaylistFormProps {
  onSuccess?: () => void;
  initialData?: PlaylistFormValues;
  isEditing?: boolean;
}

export const PlaylistForm = ({
  onSuccess,
  initialData,
  isEditing = false,
}: PlaylistFormProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { selectedSongs, clearSelection } = useSelectedSongsStore();

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

  useEffect(() => {
    if (selectedSongs.length > 0) {
      form.setValue('songs', selectedSongs.map(song => song._id));
    }
  }, [selectedSongs, form]);

  const handleSubmit = async (data: PlaylistFormValues) => {
    try {
      const formData = new FormData();
      formData.append("name", data.name);
      if (data.description) formData.append("description", data.description);
      data.songs.forEach((songId) => formData.append("songs[]", songId));
      
      if (data.artwork && data.artwork.length > 0) {
        formData.append("artwork", data.artwork[0]);
      }
      
      formData.append("isShuffled", String(data.isShuffled));
      formData.append("createdBy", "system");

      const url = isEditing 
        ? `http://localhost:5000/api/playlists/${initialData?._id}`
        : "http://localhost:5000/api/playlists";

      const response = await fetch(url, {
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

      clearSelection();

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Bir hata oluştu. Lütfen tekrar deneyin.",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <div className="grid gap-8 p-6 border rounded-lg bg-card">
          <BasicInfoForm form={form} />
          <ArtworkUpload form={form} />
          <SongSelector form={form} />
        </div>
        
        <Button type="submit" className="w-full" size="lg">
          <Save className="mr-2 h-5 w-5" />
          {isEditing ? "Güncelle" : "Playlist Oluştur"}
        </Button>
      </form>
    </Form>
  );
};