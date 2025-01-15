import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Download, AlertCircle } from "lucide-react";
import { useDownloadProgressStore } from "@/store/downloadProgressStore";

const DownloadStats = () => {
  const progressMap = useDownloadProgressStore((state) => state.progressMap);
  
  // İndirme istatistiklerini hesapla
  const stats = Object.values(progressMap).reduce(
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
  const averageProgress = stats.downloading > 0
    ? Math.round((stats.totalDownloadProgress / stats.downloading) * 10) / 10
    : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Playlist Yükleniyor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-50">
              <Download className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="ml-4">
              <div className="flex items-center gap-1">
                <span className="text-2xl font-bold text-emerald-600">{stats.downloading}</span>
                <span className="text-sm text-emerald-600 mt-1">cihaza</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {stats.downloading} adet playlist yükleniyor
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Playlist Hatası</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-50">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <div className="ml-4">
              <div className="flex items-center gap-1">
                <span className="text-2xl font-bold text-red-600">{stats.error}</span>
                <span className="text-sm text-red-600 mt-1">cihaza</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {stats.error} adet hatalı yükleme
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DownloadStats;
