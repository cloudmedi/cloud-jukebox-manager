import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface PlaybackData {
  songName: string;
  artist: string;
  playedAt: string;
  duration: number;
}

interface PlaybackTableProps {
  data: PlaybackData[];
  isLoading?: boolean;
}

export function PlaybackTable({ data = [], isLoading = false }: PlaybackTableProps) {
  if (isLoading) {
    return <div className="text-center p-4">Yükleniyor...</div>;
  }

  if (!data || data.length === 0) {
    return <div className="text-center p-4">Veri bulunamadı.</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Şarkı</TableHead>
            <TableHead>Sanatçı</TableHead>
            <TableHead className="text-right">Çalınma Zamanı</TableHead>
            <TableHead className="text-right">Süre (dk)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => (
            <TableRow key={index}>
              <TableCell>{item.songName}</TableCell>
              <TableCell>{item.artist}</TableCell>
              <TableCell className="text-right">
                {format(new Date(item.playedAt), "dd.MM.yyyy HH:mm", { locale: tr })}
              </TableCell>
              <TableCell className="text-right">
                {Math.round(item.duration / 60)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}