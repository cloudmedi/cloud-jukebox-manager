import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface PlaybackData {
  songName: string;
  artist: string;
  playCount: number;
  totalDuration: number;
  lastPlayed: string;
}

interface PlaybackTableProps {
  data?: PlaybackData[];
  isLoading?: boolean;
}

export function PlaybackTable({ data, isLoading }: PlaybackTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="rounded-md border mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Şarkı</TableHead>
            <TableHead>Sanatçı</TableHead>
            <TableHead>Çalınma Sayısı</TableHead>
            <TableHead>Toplam Süre</TableHead>
            <TableHead>Son Çalınma</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.map((item, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">{item.songName}</TableCell>
              <TableCell>{item.artist}</TableCell>
              <TableCell>{item.playCount}</TableCell>
              <TableCell>{Math.round(item.totalDuration / 60)} dk</TableCell>
              <TableCell>
                {new Date(item.lastPlayed).toLocaleDateString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}