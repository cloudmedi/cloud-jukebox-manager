import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Music, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSelectedSongsStore } from "@/store/selectedSongsStore";
import { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { PlaylistFormValues } from "../PlaylistForm";

interface SelectedSongsListProps {
  form: UseFormReturn<PlaylistFormValues>;
}

export const SelectedSongsList = ({ form }: SelectedSongsListProps) => {
  const { selectedSongs, clearSelection } = useSelectedSongsStore();

  useEffect(() => {
    if (selectedSongs.length > 0) {
      form.setValue("songs", selectedSongs.map(song => song._id));
    }
  }, [selectedSongs, form]);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Seçili Şarkılar</h2>
            {selectedSongs.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearSelection}>
                <X className="h-4 w-4 mr-2" />
                Seçimi Temizle
              </Button>
            )}
          </div>
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {selectedSongs.map((song) => (
                <div
                  key={song._id}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent"
                >
                  <Music className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{song.name}</p>
                    <p className="text-sm text-muted-foreground">{song.artist}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};