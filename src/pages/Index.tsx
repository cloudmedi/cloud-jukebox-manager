import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Play, Plus, Music2, Settings, RefreshCw, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import Player from "@/components/player/Player";

const Index = () => {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await fetch('http://localhost:5000/api/stats/playback');
      if (!response.ok) {
        throw new Error('Veriler yüklenirken bir hata oluştu');
      }
      return response.json();
    }
  });

  const { data: playlists, isLoading: playlistsLoading } = useQuery({
    queryKey: ['active-playlists'],
    queryFn: async () => {
      const response = await fetch('http://localhost:5000/api/playlists');
      if (!response.ok) {
        throw new Error('Playlistler yüklenirken bir hata oluştu');
      }
      return response.json();
    }
  });

  const recentActivities = [
    { id: 1, type: 'playlist', action: 'created', name: 'Yeni Playlist', time: '5 dakika önce' },
    { id: 2, type: 'device', action: 'connected', name: 'Mağaza-1', time: '15 dakika önce' },
    { id: 3, type: 'announcement', action: 'scheduled', name: 'Kampanya Anonsu', time: '1 saat önce' },
  ];

  if (statsLoading || playlistsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <div className="flex items-center gap-2">
            <Button asChild>
              <Link to="/playlists/new">
                <Plus className="h-4 w-4 mr-2" />
                Yeni Playlist
              </Link>
            </Button>
            <Button variant="outline">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Özet İstatistikler */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktif Playlist</CardTitle>
              <Music2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activePlaylists || 0}</div>
              <p className="text-xs text-muted-foreground">
                Toplam {stats?.totalPlaylists || 0} playlist
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Çalan Cihazlar</CardTitle>
              <Play className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.devicesPlaying || 0}</div>
              <p className="text-xs text-muted-foreground">
                Şu anda müzik çalan
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Günlük Oynatma</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">856</div>
              <p className="text-xs text-muted-foreground">
                Son 24 saat
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Süre</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">124 saat</div>
              <p className="text-xs text-muted-foreground">
                Bu ay toplam
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Aktif Playlistler */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {playlists?.slice(0, 3).map((playlist) => (
            <Card key={playlist._id} className="flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-lg font-bold">{playlist.name}</CardTitle>
                <Button size="icon" variant="ghost">
                  <Play className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <CardDescription className="line-clamp-2 mb-4">
                  {playlist.description || "Açıklama yok"}
                </CardDescription>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Şarkı Sayısı</span>
                    <span>{playlist.songs?.length || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Toplam Süre</span>
                    <span>{Math.floor((playlist.totalDuration || 0) / 60)} dk</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Son Aktiviteler */}
        <Card>
          <CardHeader>
            <CardTitle>Son Aktiviteler</CardTitle>
            <CardDescription>Son 24 saatteki işlemler</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {activity.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activity.action}
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <Player />
    </>
  );
};

export default Index;
