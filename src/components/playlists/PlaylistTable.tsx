import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Play, Pencil, Send, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDuration } from "@/lib/utils";
import { SendPlaylistDialog } from "./SendPlaylistDialog";

interface Playlist {
  _id: string;
  name: string;
  description?: string;
  songs: any[];
  totalDuration?: number;
  genre?: string;
  artwork?: string;
}

interface PlaylistTableProps {
  playlists: Playlist[];
  onPlaylistUpdate: () => void;
}

export const PlaylistTable = ({ playlists, onPlaylistUpdate }: PlaylistTableProps) => {
  const [playlistToDelete, setPlaylistToDelete] = useState<string | null>(null);
  const [sendDialogPlaylist, setSendDialogPlaylist] = useState<Playlist | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleDelete = useCallback(async (id: string) => {
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
  }, [onPlaylistUpdate, toast]);

  const handleEdit = useCallback((id: string) => {
    console.log("Edit playlist:", id);
  }, []);

  const handlePlay = useCallback((id: string) => {
    const mainLayout = document.querySelector('.main-layout');
    if (mainLayout) {
      mainLayout.setAttribute('data-player-visible', 'true');
    }
    console.log("Play playlist:", id);
  }, []);

  if (!playlists?.length) {
    return (
      <div 
        className="flex h-[400px] items-center justify-center rounded-lg border bg-muted/5 text-center"
        role="alert"
        aria-label="Boş playlist listesi"
      >
        <div className="space-y-2 px-8">
          <h3 className="text-lg font-medium">Henüz playlist oluşturulmamış</h3>
          <p className="text-sm text-muted-foreground">
            Yeni bir playlist oluşturmak için yukarıdaki "Yeni Playlist" butonunu kullanın.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Kapak</TableHead>
            <TableHead>Playlist Adı</TableHead>
            <TableHead>Şarkı Sayısı</TableHead>
            <TableHead>Toplam Süre</TableHead>
            <TableHead>Tür</TableHead>
            <TableHead className="text-right">İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {playlists.map((playlist) => (
            <TableRow key={playlist._id}>
              <TableCell>
                {playlist.artwork ? (
                  <img
                    src={`http://localhost:5000${playlist.artwork}`}
                    alt={playlist.name}
                    className="h-12 w-12 rounded-md object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center">
                    <span className="text-muted-foreground">No img</span>
                  </div>
                )}
              </TableCell>
              <TableCell className="font-medium">{playlist.name}</TableCell>
              <TableCell>{playlist.songs.length} şarkı</TableCell>
              <TableCell>
                {playlist.totalDuration
                  ? formatDuration(playlist.totalDuration)
                  : "0:00"}
              </TableCell>
              <TableCell>{playlist.genre || "-"}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Menüyü aç</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handlePlay(playlist._id)}>
                      <Play className="mr-2 h-4 w-4" />
                      Oynat
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEdit(playlist._id)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Düzenle
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSendDialogPlaylist(playlist)}>
                      <Send className="mr-2 h-4 w-4" />
                      Gönder
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setPlaylistToDelete(playlist._id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Sil
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog 
        open={!!playlistToDelete} 
        onOpenChange={() => setPlaylistToDelete(null)}
      >
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

      {sendDialogPlaylist && (
        <SendPlaylistDialog
          isOpen={!!sendDialogPlaylist}
          onClose={() => setSendDialogPlaylist(null)}
          playlist={sendDialogPlaylist}
        />
      )}
    </div>
  );
};