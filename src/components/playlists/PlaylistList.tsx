import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MoreVertical, Play, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Playlist {
  _id: string;
  name: string;
  description?: string;
  songs: any[];
  totalDuration?: number;
}

interface PlaylistListProps {
  playlists: Playlist[];
  onPlaylistUpdate: () => void;
}

export const PlaylistList = ({ playlists, onPlaylistUpdate }: PlaylistListProps) => {
  const [playlistToDelete, setPlaylistToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/playlists/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Playlist silinemedi");
      }

      toast({
        title: "Başarılı",
        description: "Playlist başarıyla silindi",
      });

      onPlaylistUpdate();
      setPlaylistToDelete(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Playlist silinirken bir hata oluştu",
      });
    }
  };

  if (!playlists?.length) {
    return (
      <div className="text-center p-8 border rounded-lg bg-muted/10">
        <p className="text-muted-foreground">Henüz playlist oluşturulmamış</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {playlists.map((playlist) => (
        <div
          key={playlist._id}
          className="border rounded-lg p-4 space-y-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold truncate">{playlist.name}</h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Play className="mr-2 h-4 w-4" />
                  Oynat
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Pencil className="mr-2 h-4 w-4" />
                  Düzenle
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={() => setPlaylistToDelete(playlist._id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Sil
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2">
            {playlist.description || "Açıklama yok"}
          </p>

          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{playlist.songs?.length || 0} şarkı</span>
            <span>
              {playlist.totalDuration
                ? `${Math.floor(playlist.totalDuration / 60)} dk`
                : "0 dk"}
            </span>
          </div>
        </div>
      ))}

      <AlertDialog open={!!playlistToDelete} onOpenChange={() => setPlaylistToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Playlist'i Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu playlist'i silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => playlistToDelete && handleDelete(playlistToDelete)}
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};