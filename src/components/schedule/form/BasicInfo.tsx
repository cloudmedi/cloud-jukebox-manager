import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Music, ListMusic } from "lucide-react";

export function BasicInfo() {
  const { data: playlists = [] } = useQuery({
    queryKey: ["playlists"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/playlists");
      if (!response.ok) throw new Error("Playlistler yüklenemedi");
      return response.json();
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-lg font-semibold text-primary">
        <ListMusic className="h-5 w-5" />
        <span>Temel Bilgiler</span>
      </div>
      
      <FormField
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Zamanlama Adı</FormLabel>
            <FormControl>
              <Input placeholder="Örn: Sabah Müzikleri" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        name="playlistId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Playlist</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Playlist seçin" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {playlists.map((playlist: any) => (
                  <SelectItem key={playlist._id} value={playlist._id}>
                    {playlist.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}