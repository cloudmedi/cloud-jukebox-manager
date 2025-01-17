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
import { PlaylistCard } from "./PlaylistCard";
import { PlaylistPagination } from "./PlaylistPagination";

interface Playlist {
  _id: string;
  name: string;
  description?: string;
  songs: any[];
  totalDuration?: number;
  genre?: string;
}

interface PlaylistListProps {
  playlists: Playlist[];
  onPlaylistUpdate: () => void;
}

const ITEMS_PER_PAGE = 18;

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
    // Show player in MainLayout
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
    <div className="space-y-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {currentPlaylists.map((playlist) => (
          <PlaylistCard
            key={playlist._id}
            playlist={playlist}
            onDelete={setPlaylistToDelete}
            onEdit={handleEdit}
            onPlay={handlePlay}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center">
          <PlaylistPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

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
