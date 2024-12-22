import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { Music2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PlaylistSongManager } from "./PlaylistSongManager";

interface Song {
  _id: string;
  name: string;
  artist: string;
  duration: number;
}

interface Playlist {
  _id: string;
  name: string;
  description: string;
  songs: Song[];
  status: "active" | "inactive";
  createdAt: string;
  totalDuration: number;
}

interface PlaylistListProps {
  playlists: Playlist[];
  onPlaylistUpdate: () => void;
}

export const PlaylistList = ({ playlists, onPlaylistUpdate }: PlaylistListProps) => {
  if (!playlists?.length) {
    return (
      <div className="text-center py-10">
        <Music2 className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Henüz playlist yok</h3>
        <p className="text-muted-foreground">Yeni bir playlist oluşturun</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {playlists.map((playlist) => (
        <Card key={playlist._id} className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-bold">{playlist.name}</CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Düzenle</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">
                  Sil
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent className="flex-1">
            <CardDescription className="line-clamp-2 mb-4">
              {playlist.description || "Açıklama yok"}
            </CardDescription>
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Şarkı Sayısı</span>
                <span className="font-medium">{playlist.songs.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Toplam Süre</span>
                <span className="font-medium">
                  {Math.floor(playlist.totalDuration / 60)}:
                  {String(playlist.totalDuration % 60).padStart(2, "0")}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Oluşturulma</span>
                <span className="font-medium">
                  {formatDistanceToNow(new Date(playlist.createdAt), {
                    addSuffix: true,
                    locale: tr,
                  })}
                </span>
              </div>
              <div className="pt-2">
                <Badge variant={playlist.status === "active" ? "default" : "secondary"}>
                  {playlist.status === "active" ? "Aktif" : "Pasif"}
                </Badge>
              </div>
            </div>
            <PlaylistSongManager 
              playlist={playlist} 
              onPlaylistUpdate={onPlaylistUpdate}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};