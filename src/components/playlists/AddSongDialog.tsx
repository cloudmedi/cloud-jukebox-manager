import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Song } from "@/types/song";
import { SongSkeleton } from "./SongSkeleton";

interface AddSongDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableSongs?: Song[];
  isLoading: boolean;
  error: Error | null;
  onAddSong: (songId: string) => void;
}

export const AddSongDialog = ({
  open,
  onOpenChange,
  availableSongs,
  isLoading,
  error,
  onAddSong,
}: AddSongDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Şarkı Ekle</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[400px] pr-4">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <SongSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Hata</AlertTitle>
              <AlertDescription>
                Şarkılar yüklenirken bir hata oluştu. Lütfen daha sonra tekrar
                deneyin.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-1">
              {availableSongs?.map((song) => (
                <div
                  key={song._id}
                  className="flex items-center justify-between rounded-lg border p-2 hover:bg-accent"
                >
                  <div>
                    <p className="font-medium">{song.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {song.artist}
                    </p>
                  </div>
                  <Button onClick={() => onAddSong(song._id)}>Ekle</Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};