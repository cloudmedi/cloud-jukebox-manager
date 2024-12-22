import { useQuery } from "@tanstack/react-query";
import { Music, MoreVertical, Play, Pencil, Trash } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface Song {
  _id: string;
  name: string;
  artist: string;
  genre: string;
  duration: number;
  createdAt: string;
}

const SongList = () => {
  const { toast } = useToast();

  const { data: songs, isLoading, refetch } = useQuery({
    queryKey: ["songs"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/songs");
      if (!response.ok) throw new Error("Failed to fetch songs");
      return response.json();
    },
  });

  const formatDuration = (duration: number) => {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/songs/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete song");

      toast({
        title: "Başarılı",
        description: "Şarkı başarıyla silindi",
      });

      refetch();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Şarkı silinirken bir hata oluştu",
      });
    }
  };

  if (isLoading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Şarkı</TableHead>
            <TableHead>Sanatçı</TableHead>
            <TableHead>Tür</TableHead>
            <TableHead>Süre</TableHead>
            <TableHead>Eklenme Tarihi</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {songs?.map((song: Song) => (
            <TableRow key={song._id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Music className="h-4 w-4 text-primary" />
                  {song.name}
                </div>
              </TableCell>
              <TableCell>{song.artist}</TableCell>
              <TableCell>{song.genre}</TableCell>
              <TableCell>{formatDuration(song.duration)}</TableCell>
              <TableCell>
                {new Date(song.createdAt).toLocaleDateString("tr-TR")}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Play className="mr-2 h-4 w-4" />
                      Oynat
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Pencil className="mr-2 h-4 w-4" />
                      Düzenle
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDelete(song._id)}
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Sil
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default SongList;