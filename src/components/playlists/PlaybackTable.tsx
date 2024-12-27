import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDuration } from "@/lib/utils";

interface Playlist {
  _id: string;
  name: string;
  description?: string;
  songs: any[];
  artwork?: string;
  createdAt: string;
}

interface PlaybackTableProps {
  data: Playlist[] | undefined;
}

export function PlaybackTable({ data }: PlaybackTableProps) {
  if (!data?.length) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        Henüz playlist bulunmuyor
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Playlist Adı</TableHead>
          <TableHead>Şarkı Sayısı</TableHead>
          <TableHead>Toplam Süre</TableHead>
          <TableHead>Oluşturulma Tarihi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((playlist) => (
          <TableRow key={playlist._id}>
            <TableCell className="font-medium">{playlist.name}</TableCell>
            <TableCell>{playlist.songs.length}</TableCell>
            <TableCell>
              {formatDuration(
                playlist.songs.reduce((acc, song) => acc + (song.duration || 0), 0)
              )}
            </TableCell>
            <TableCell>
              {new Date(playlist.createdAt).toLocaleDateString("tr-TR")}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}