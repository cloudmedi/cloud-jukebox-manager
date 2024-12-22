import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";

const formSchema = z.object({
  name: z.string().min(2, "Playlist adı en az 2 karakter olmalıdır"),
  description: z.string().optional(),
  isShuffled: z.boolean().default(false),
});

interface PlaylistFormProps {
  onSuccess: () => void;
}

export const PlaylistForm = ({ onSuccess }: PlaylistFormProps) => {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      isShuffled: false,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const response = await fetch("http://localhost:5000/api/playlists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          createdBy: "admin", // TODO: Gerçek kullanıcı bilgisi eklenecek
        }),
      });

      if (!response.ok) {
        throw new Error("Playlist oluşturulamadı");
      }

      toast({
        title: "Başarılı",
        description: "Playlist başarıyla oluşturuldu",
      });

      onSuccess();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Playlist oluşturulurken bir hata oluştu",
      });
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
                <Textarea placeholder="Playlist açıklaması..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isShuffled"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Karışık Çalma</FormLabel>
                <div className="text-sm text-muted-foreground">
                  Şarkılar rastgele sırayla çalınır
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

        <div className="flex justify-end gap-4">
          <Button type="submit">Oluştur</Button>
        </div>
      </form>
    </Form>
  );
};