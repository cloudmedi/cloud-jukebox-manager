import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlaylistList } from "@/components/playlists/PlaylistList";
import { PlaylistDialog } from "@/components/playlists/PlaylistDialog";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

const PlaylistSkeleton = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-32" />
    </div>
    {[1, 2, 3].map((i) => (
      <div key={i} className="border rounded-lg p-4 space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
    ))}
  </div>
);

const ErrorFallback = ({ error, retry }: { error: Error; retry: () => void }) => (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Hata</AlertTitle>
    <AlertDescription className="space-y-4">
      <p>Playlistler yüklenirken bir hata oluştu: {error.message}</p>
      <Button variant="outline" onClick={retry}>
        Tekrar Dene
      </Button>
    </AlertDescription>
  </Alert>
);

const Playlists = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: playlists, isLoading, error, refetch } = useQuery({
    queryKey: ["playlists"],
    queryFn: async () => {
      try {
        const response = await fetch("http://localhost:5000/api/playlists");
        if (!response.ok) {
          throw new Error("Playlist verileri alınamadı");
        }
        return response.json();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Playlist verileri yüklenirken bir hata oluştu",
        });
        throw error;
      }
    },
  });

  const handlePlaylistUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ["playlists"] });
    toast({
      title: "Başarılı",
      description: "Playlist başarıyla güncellendi",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Playlist Yönetimi</h2>
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Playlist
          </Button>
        </div>
        <PlaylistSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Playlist Yönetimi</h2>
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Playlist
          </Button>
        </div>
        <ErrorFallback error={error as Error} retry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Playlist Yönetimi</h2>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Playlist
        </Button>
      </div>

      <PlaylistList 
        playlists={playlists} 
        onPlaylistUpdate={handlePlaylistUpdate}
      />

      <PlaylistDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
};

export default Playlists;