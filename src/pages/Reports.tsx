import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DevicePlaybackReport } from "@/components/reports/DevicePlaybackReport";

const Reports = () => {
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
    <>
      <h1>Raporlama</h1>
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Genel Raporlar</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Toplam Cihaz: {stats?.total || 0}</p>
            <p>Çevrimiçi: {stats?.online || 0}</p>
            <p>Çevrimdışı: {stats?.offline || 0}</p>
            <p>Aktif Playlist: {stats?.withPlaylist || 0}</p>
          </CardContent>
        </Card>
        <DevicePlaybackReport />
      </div>
    </>
  );
};

export default Reports;
