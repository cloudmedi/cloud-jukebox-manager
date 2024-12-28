import { useQuery } from "@tanstack/react-query";
import { MapPin, TrendingUp, TrendingDown, Music } from "lucide-react";

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
      <div className="bg-card rounded-lg p-4 border transition-all duration-200 hover:shadow-lg hover:scale-[1.02] hover:border-primary/20">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Toplam Cihaz</span>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-xs text-green-500">+2%</span>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <p className="text-2xl font-bold">{stats?.total || 0}</p>
          <MapPin className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      <div className="bg-card rounded-lg p-4 border transition-all duration-200 hover:shadow-lg hover:scale-[1.02] hover:border-primary/20">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Çevrimiçi</span>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-xs text-green-500">+5%</span>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <p className="text-2xl font-bold text-green-500">{stats?.online || 0}</p>
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        </div>
      </div>

      <div className="bg-card rounded-lg p-4 border transition-all duration-200 hover:shadow-lg hover:scale-[1.02] hover:border-primary/20">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Çevrimdışı</span>
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-500" />
            <span className="text-xs text-red-500">-3%</span>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <p className="text-2xl font-bold text-red-500">{stats?.offline || 0}</p>
          <div className="h-2 w-2 rounded-full bg-red-500" />
        </div>
      </div>

      <div className="bg-card rounded-lg p-4 border transition-all duration-200 hover:shadow-lg hover:scale-[1.02] hover:border-primary/20">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Aktif Playlist</span>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            <span className="text-xs text-blue-500">+8%</span>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <p className="text-2xl font-bold text-blue-500">{stats?.withPlaylist || 0}</p>
          <Music className="h-4 w-4 text-blue-500" />
        </div>
      </div>
    </div>
  );
};

export default DeviceStats;