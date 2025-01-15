import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlayCircle, Smartphone, Calendar, Activity, Music, AlertTriangle } from "lucide-react";
import PlaybackStats from "@/components/reports/PlaybackStats";
import DeviceStats from "@/components/reports/DeviceStats";
import ScheduleStats from "@/components/reports/ScheduleStats";
import PerformanceStats from "@/components/reports/PerformanceStats";
import DevicePlaybackReport from "@/components/reports/DevicePlaybackReport";
import ErrorLogs from "@/components/reports/ErrorLogs";
import DownloadStats from "@/components/reports/DownloadStats";

const Reports = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Raporlama</h2>
      </div>

      <Tabs defaultValue="playback" className="space-y-4">
        <TabsList>
          <TabsTrigger value="playback" className="flex items-center gap-2">
            <PlayCircle className="h-4 w-4" />
            Oynatma İstatistikleri
          </TabsTrigger>
          <TabsTrigger value="devices" className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            Cihaz Durumu
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Zamanlama Raporları
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Performans Metrikleri
          </TabsTrigger>
          <TabsTrigger value="device-playback" className="flex items-center gap-2">
            <Music className="h-4 w-4" />
            Cihaz Çalma Raporu
          </TabsTrigger>
          <TabsTrigger value="error-logs" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Hata Logları
          </TabsTrigger>
          <TabsTrigger value="download" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            İndirme İstatistikleri
          </TabsTrigger>
        </TabsList>

        <TabsContent value="playback">
          <PlaybackStats />
        </TabsContent>

        <TabsContent value="devices">
          <DeviceStats />
        </TabsContent>

        <TabsContent value="schedule">
          <ScheduleStats />
        </TabsContent>

        <TabsContent value="performance">
          <PerformanceStats />
        </TabsContent>

        <TabsContent value="device-playback">
          <DevicePlaybackReport />
        </TabsContent>

        <TabsContent value="error-logs">
          <ErrorLogs />
        </TabsContent>

        <TabsContent value="download">
          <DownloadStats />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;