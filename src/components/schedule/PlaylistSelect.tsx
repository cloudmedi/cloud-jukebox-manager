import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { UseFormReturn } from "react-hook-form";
import { ScheduleFormData } from "./types";

interface PlaylistSelectProps {
  form: UseFormReturn<ScheduleFormData>;
}

export const PlaylistSelect = ({ form }: PlaylistSelectProps) => {
  const { data: playlists } = useQuery({
    queryKey: ["playlists"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/playlists");
      return response.json();
    },
  });

  return (
    <FormField
      control={form.control}
      name="playlist"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Playlist</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Playlist seçin" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {playlists?.map((playlist: any) => (
                <SelectItem key={playlist._id} value={playlist._id}>
                  {playlist.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormItem>
      )}
    />
  );
};