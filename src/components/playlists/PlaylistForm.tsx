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

const MAX_FILE_SIZE = 5000000;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const playlistSchema = z.object({
  name: z.string().min(1, "Playlist adı gereklidir").max(100, "Playlist adı çok uzun"),
  description: z.string().max(500, "Açıklama çok uzun").optional(),
  songs: z.array(z.string()).default([]),
  artwork: z
    .any()
    .refine((files) => !files || files?.length === 0 || files?.length === 1, "Bir adet kapak resmi seçin")
    .refine(
      (files) => !files || files?.length === 0 || files?.[0]?.size <= MAX_FILE_SIZE,
      "Maksimum dosya boyutu 5MB"
    )
    .refine(
      (files) => !files || files?.length === 0 || ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      "Sadece .jpg, .jpeg, .png ve .webp formatları kabul edilir"
    )
    .optional(),
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
      data.songs.forEach((songId) => formData.append("songs[]", songId));
      
      // Artwork kontrolü ve eklenmesi
      if (data.artwork && data.artwork[0] instanceof File) {
        formData.append("artwork", data.artwork[0]);
      }
      
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
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <BasicInfoForm form={form} />
        <ArtworkUpload form={form} />
        <SongSelector form={form} />
        
        <Button type="submit" className="w-full">
          {isEditing ? "Güncelle" : "Oluştur"}
        </Button>
      </form>
    </Form>
  );
};