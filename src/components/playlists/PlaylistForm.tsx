import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
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
import { Loader2 } from "lucide-react";

const playlistFormSchema = z.object({
  name: z.string()
    .min(2, "Playlist adı en az 2 karakter olmalıdır")
    .max(50, "Playlist adı en fazla 50 karakter olabilir"),
  description: z.string()
    .max(200, "Açıklama en fazla 200 karakter olabilir")
    .optional(),
});

type PlaylistFormData = z.infer<typeof playlistFormSchema>;

interface PlaylistFormProps {
  onSuccess: () => void;
}

export const PlaylistForm = ({ onSuccess }: PlaylistFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<PlaylistFormData>({
    resolver: zodResolver(playlistFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const onSubmit = async (data: PlaylistFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("http://localhost:5000/api/playlists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          songs: [],
          createdBy: "user123", // TODO: Implement real user ID
        }),
      });

      if (!response.ok) {
        throw new Error("Playlist oluşturulamadı");
      }

      const result = await response.json();

      toast({
        title: "Başarılı",
        description: "Playlist başarıyla oluşturuldu",
      });

      queryClient.invalidateQueries({ queryKey: ["playlists"] });
      form.reset();
      onSuccess();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error instanceof Error ? error.message : "Playlist oluşturulurken bir hata oluştu",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Playlist Adı</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Yeni Playlist" 
                  {...field} 
                  disabled={isSubmitting}
                />
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
                  className="resize-none"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          disabled={isSubmitting} 
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Oluşturuluyor
            </>
          ) : (
            "Playlist Oluştur"
          )}
        </Button>
      </form>
    </Form>
  );
};