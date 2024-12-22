import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
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

interface PlaylistFormData {
  name: string;
  description?: string;
}

interface PlaylistFormProps {
  onSuccess: () => void;
}

export const PlaylistForm = ({ onSuccess }: PlaylistFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<PlaylistFormData>({
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

      toast({
        title: "Başarılı",
        description: "Playlist başarıyla oluşturuldu",
      });

      queryClient.invalidateQueries({ queryKey: ["playlists"] });
      onSuccess();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Playlist oluşturulurken bir hata oluştu",
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
          rules={{ required: "Playlist adı zorunludur" }}
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
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full">
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