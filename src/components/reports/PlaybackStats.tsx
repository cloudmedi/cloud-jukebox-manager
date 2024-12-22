import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2 } from "lucide-react";

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
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const chartData = [
    { name: 'Pazartesi', plays: 120 },
    { name: 'Salı', plays: 150 },
    { name: 'Çarşamba', plays: 180 },
    { name: 'Perşembe', plays: 140 },
    { name: 'Cuma', plays: 200 },
    { name: 'Cumartesi', plays: 160 },
    { name: 'Pazar', plays: 130 }
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Toplam Playlist</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalPlaylists || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.activePlaylists || 0} aktif playlist
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Çalan Cihazlar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.devicesPlaying || 0}</div>
            <p className="text-xs text-muted-foreground">
              Şu anda müzik çalan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Günlük Oynatma</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">856</div>
            <p className="text-xs text-muted-foreground">
              Son 24 saat
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Toplam Süre</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">124 saat</div>
            <p className="text-xs text-muted-foreground">
              Bu ay toplam
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Haftalık Oynatma Grafiği</CardTitle>
          <CardDescription>Son 7 günün oynatma istatistikleri</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="plays" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlaybackStats;