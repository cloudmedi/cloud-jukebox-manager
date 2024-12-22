import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PlaybackStats = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['playback-stats'],
    queryFn: async () => {
      const response = await fetch('http://localhost:5000/api/stats/playback');
      if (!response.ok) {
        throw new Error('Veriler yüklenirken bir hata oluştu');
      }
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Oynatma İstatistikleri</CardTitle>
          <CardDescription>Yükleniyor...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader>
          <CardTitle>Toplam Oynatma</CardTitle>
          <CardDescription>Son 30 gün</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">1,234</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>En Çok Çalınan</CardTitle>
          <CardDescription>Bu ay</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Top Hits</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ortalama Süre</CardTitle>
          <CardDescription>Günlük oynatma</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">4.5 saat</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Aktif Cihazlar</CardTitle>
          <CardDescription>Şu anda çalan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">8</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlaybackStats;