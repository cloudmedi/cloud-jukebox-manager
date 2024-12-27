import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";

export const DeviceStats = () => {
  const { data: stats } = useQuery({
    queryKey: ['device-stats'],
    queryFn: async () => {
      const response = await fetch('http://localhost:5000/api/stats/devices');
      if (!response.ok) {
        throw new Error('Veriler yüklenirken bir hata oluştu');
      }
      return response.json();
    }
  });

  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="bg-card rounded-lg p-4 border">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Toplam Cihaz</span>
          <MapPin className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className="text-2xl font-bold mt-2">{stats?.total || 0}</p>
      </div>
      <div className="bg-card rounded-lg p-4 border">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Çevrimiçi</span>
          <div className="h-2 w-2 rounded-full bg-green-500" />
        </div>
        <p className="text-2xl font-bold mt-2 text-green-500">{stats?.online || 0}</p>
      </div>
      <div className="bg-card rounded-lg p-4 border">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Çevrimdışı</span>
          <div className="h-2 w-2 rounded-full bg-red-500" />
        </div>
        <p className="text-2xl font-bold mt-2 text-red-500">{stats?.offline || 0}</p>
      </div>
      <div className="bg-card rounded-lg p-4 border">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Aktif Playlist</span>
          <div className="h-2 w-2 rounded-full bg-blue-500" />
        </div>
        <p className="text-2xl font-bold mt-2 text-blue-500">{stats?.withPlaylist || 0}</p>
      </div>
    </div>
  );
};