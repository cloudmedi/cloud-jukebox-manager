import { useQuery } from "@tanstack/react-query";
import { Monitor, Activity, Download, AlertCircle, WifiOff } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export const DeviceStats = () => {
  const { data: devices } = useQuery({
    queryKey: ['devices'],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/devices");
      if (!response.ok) {
        throw new Error("Cihazlar yüklenirken bir hata oluştu");
      }
      return response.json();
    },
    refetchInterval: 5000
  });

  const stats = {
    total: devices?.length || 0,
    online: devices?.filter(d => d.isOnline).length || 0,
    loading: devices?.filter(d => d.playlistStatus === 'loading').length || 0,
    error: devices?.filter(d => d.playlistStatus === 'error').length || 0
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Toplam Cihaz</CardTitle>
          <Monitor className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">
            {stats.online} aktif cihaz
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Çevrimiçi</CardTitle>
          <Activity className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-500">{stats.online}</div>
          <p className="text-xs text-muted-foreground">
            {((stats.online / stats.total) * 100).toFixed(0) || 0}% aktif
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Çevrimdışı</CardTitle>
          <WifiOff className="h-4 w-4 text-slate-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-500">{stats.total - stats.online}</div>
          <p className="text-xs text-muted-foreground">
            {(((stats.total - stats.online) / stats.total) * 100).toFixed(0) || 0}% pasif
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Playlist Yükleniyor</CardTitle>
          <Download className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-500">{stats.loading}</div>
          <p className="text-xs text-muted-foreground">
            {((stats.loading / stats.total) * 100).toFixed(0) || 0}% yükleniyor
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Playlist Hatası</CardTitle>
          <AlertCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-500">{stats.error}</div>
          <p className="text-xs text-muted-foreground">
            {((stats.error / stats.total) * 100).toFixed(0) || 0}% hata
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeviceStats;