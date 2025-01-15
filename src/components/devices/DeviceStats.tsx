import { useQuery } from "@tanstack/react-query";
import { Monitor, Activity, Download, AlertCircle, WifiOff } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useDownloadProgressStore } from "@/store/downloadProgressStore";

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

  const progressMap = useDownloadProgressStore((state) => state.progressMap);
  
  // İndirme istatistiklerini hesapla
  const downloadStats = Object.values(progressMap).reduce(
    (acc, curr) => {
      if (curr.status === "downloading") {
        acc.downloading++;
        acc.totalDownloadProgress += curr.progress || 0;
      } else if (curr.status === "error") {
        acc.error++;
      }
      return acc;
    },
    { downloading: 0, error: 0, totalDownloadProgress: 0 }
  );

  // Ortalama ilerleme yüzdesini hesapla
  const averageProgress = downloadStats.downloading > 0
    ? Math.round((downloadStats.totalDownloadProgress / downloadStats.downloading) * 10) / 10
    : 0;

  const stats = {
    total: devices?.length || 0,
    online: devices?.filter(d => d.isOnline).length || 0,
    loading: downloadStats.downloading,
    error: downloadStats.error
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
          <div className="flex items-center gap-1">
            <span className="text-2xl font-bold text-orange-500">{stats.loading}</span>
            <span className="text-sm text-orange-500 mt-1">cihaza</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.loading} adet playlist yükleniyor
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Playlist Hatası</CardTitle>
          <AlertCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-1">
            <span className="text-2xl font-bold text-red-500">{stats.error}</span>
            <span className="text-sm text-red-500 mt-1">cihaza</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.error} adet hatalı yükleme
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeviceStats;