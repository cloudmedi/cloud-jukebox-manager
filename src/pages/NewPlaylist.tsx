import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, Image, Music, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery } from "@tanstack/react-query";

const formSchema = z.object({
  name: z.string().min(1, "Playlist adı gereklidir"),
  description: z.string().optional(),
  artwork: z.instanceof(File).optional(),
  songs: z.array(z.string()).default([]),
});

type FormData = z.infer<typeof formSchema>;

const NewPlaylist = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      songs: [],
    },
  });

  const { data: songs = [] } = useQuery({
    queryKey: ["songs"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/songs");
      if (!response.ok) throw new Error("Şarkılar yüklenemedi");
      return response.json();
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const formData = new FormData();
      formData.append("name", data.name);
      if (data.description) formData.append("description", data.description);
      if (data.artwork) formData.append("artwork", data.artwork);
      data.songs.forEach((songId) => formData.append("songs[]", songId));

      const response = await fetch("http://localhost:5000/api/playlists", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Playlist oluşturulamadı");

      toast({
        title: "Başarılı",
        description: "Playlist başarıyla oluşturuldu",
      });

      navigate("/playlists");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Playlist oluşturulurken bir hata oluştu",
      });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue("artwork", file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-8">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/playlists")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">
          Yeni Playlist Oluştur
        </h1>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Playlist Adı
              </label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="Örn: En Sevdiğim Şarkılar"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Açıklama
              </label>
              <Textarea
                id="description"
                {...form.register("description")}
                placeholder="Playlist hakkında kısa bir açıklama yazın..."
                className="resize-none"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Kapak Resmi</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-border">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Kapak resmi önizleme"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-muted">
                      <Image className="h-16 w-16 text-muted-foreground/25" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col justify-center space-y-4">
                  <label
                    htmlFor="artwork"
                    className="cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    {previewUrl ? "Resmi Değiştir" : "Kapak Resmi Seç"}
                  </label>
                  <input
                    id="artwork"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <p className="text-sm text-muted-foreground">
                    PNG, JPG veya WEBP formatında, maksimum 5MB boyutunda bir
                    resim seçin
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Şarkılar</h2>
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-4">
                  {songs.map((song: any) => (
                    <label
                      key={song._id}
                      className="flex items-center space-x-3 rounded-lg p-2 hover:bg-accent cursor-pointer"
                    >
                      <Checkbox
                        checked={form.watch("songs").includes(song._id)}
                        onCheckedChange={(checked) => {
                          const currentSongs = form.watch("songs");
                          const newSongs = checked
                            ? [...currentSongs, song._id]
                            : currentSongs.filter((id) => id !== song._id);
                          form.setValue("songs", newSongs);
                        }}
                      />
                      <div className="flex items-center gap-2">
                        <Music className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{song.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {song.artist}
                          </p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" size="lg" className="w-full">
          <Plus className="mr-2 h-5 w-5" />
          Playlist Oluştur
        </Button>
      </form>
    </div>
  );
};

export default NewPlaylist;