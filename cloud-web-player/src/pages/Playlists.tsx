import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { storageService } from "@/services/storage/StorageService";
import { toast } from "@/hooks/use-toast";
import { Music2 } from "lucide-react";

interface Playlist {
  _id: string;
  name: string;
  description?: string;
  artwork?: string;
  songs: any[];
}

const Playlists = () => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlaylists = async () => {
      try {
        const db = await storageService.openDatabase();
        const transaction = db.transaction(['playlists'], 'readonly');
        const store = transaction.objectStore('playlists');
        const request = store.getAll();

        request.onsuccess = () => {
          setPlaylists(request.result || []);
          setLoading(false);
        };

        request.onerror = () => {
          console.error('Error loading playlists:', request.error);
          toast({
            variant: "destructive",
            title: "Hata",
            description: "Playlistler yüklenirken bir hata oluştu"
          });
          setLoading(false);
        };
      } catch (error) {
        console.error('Error accessing database:', error);
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Veritabanına erişilirken bir hata oluştu"
        });
        setLoading(false);
      }
    };

    loadPlaylists();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (playlists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-center space-y-4">
        <Music2 className="h-12 w-12 text-muted-foreground/40" />
        <div>
          <h3 className="text-lg font-semibold">Henüz playlist yok</h3>
          <p className="text-sm text-muted-foreground">
            İndirilen playlistler burada görüntülenecek
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-2xl font-bold">İndirilen Playlistler</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {playlists.map((playlist) => (
          <Card key={playlist._id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader className="relative aspect-square p-0">
              {playlist.artwork ? (
                <img
                  src={playlist.artwork}
                  alt={playlist.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted">
                  <Music2 className="h-24 w-24 text-muted-foreground/40" />
                </div>
              )}
            </CardHeader>
            <CardContent className="p-4">
              <CardTitle className="line-clamp-1 text-lg">{playlist.name}</CardTitle>
              {playlist.description && (
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                  {playlist.description}
                </p>
              )}
              <div className="mt-4 flex items-center text-sm text-muted-foreground">
                <Music2 className="mr-1 h-4 w-4" />
                <span>{playlist.songs?.length || 0} şarkı</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Playlists;