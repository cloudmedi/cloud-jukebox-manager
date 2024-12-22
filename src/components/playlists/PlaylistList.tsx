import { useState, useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
import { VirtualizedPlaylistList } from "./VirtualizedPlaylistList";
import { PlaylistPagination } from "./PlaylistPagination";

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

const ITEMS_PER_PAGE = 6;

export const PlaylistList = ({ playlists, onPlaylistUpdate }: PlaylistListProps) => {
  const [playlistToDelete, setPlaylistToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const totalPages = useMemo(() => 
    Math.ceil(playlists.length / ITEMS_PER_PAGE), 
    [playlists.length]
  );

  const currentPlaylists = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return playlists.slice(startIndex, endIndex);
  }, [playlists, currentPage]);

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
    console.log("Play playlist:", id);
  }, []);

  if (!playlists?.length) {
    return (
      <div 
        className="text-center p-8 border rounded-lg bg-muted/10"
        role="alert"
        aria-label="Boş playlist listesi"
      >
        <p className="text-muted-foreground">Henüz playlist oluşturulmamış</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <VirtualizedPlaylistList
        playlists={currentPlaylists}
        onDelete={setPlaylistToDelete}
        onEdit={handleEdit}
        onPlay={handlePlay}
      />

      <PlaylistPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

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
    </div>
  );
};