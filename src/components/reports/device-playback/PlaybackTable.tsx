import { Loader2 } from "lucide-react";

interface PlaybackData {
  songName: string;
  artist: string;
  playCount: number;
  totalDuration: number;
  lastPlayed: string;
}

interface PlaybackTableProps {
  data: PlaybackData[] | null;
  isLoading: boolean;
}

export function PlaybackTable({ data, isLoading }: PlaybackTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="p-2 text-left">Şarkı</th>
            <th className="p-2 text-left">Sanatçı</th>
            <th className="p-2 text-left">Çalınma Sayısı</th>
            <th className="p-2 text-left">Toplam Süre</th>
            <th className="p-2 text-left">Son Çalınma</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item: PlaybackData, index: number) => (
            <tr key={index} className="border-b">
              <td className="p-2">{item.songName}</td>
              <td className="p-2">{item.artist}</td>
              <td className="p-2">{item.playCount}</td>
              <td className="p-2">{Math.round(item.totalDuration / 60)} dk</td>
              <td className="p-2">
                {new Date(item.lastPlayed).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}