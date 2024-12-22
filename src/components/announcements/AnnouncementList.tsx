import { useQuery } from "@tanstack/react-query";
import { Play, Pencil, Trash, MoreVertical, Calendar } from "lucide-react";
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

interface Announcement {
  _id: string;
  title: string;
  description: string;
  filePath: string;
  duration: number;
  status: string;
  createdAt: string;
}

const AnnouncementList = () => {
  const { toast } = useToast();

  const { data: announcements, isLoading } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/announcements");
      if (!response.ok) throw new Error("Failed to fetch announcements");
      return response.json();
    },
  });

  const formatDuration = (duration: number) => {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Başlık</TableHead>
            <TableHead>Açıklama</TableHead>
            <TableHead>Süre</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead>Eklenme Tarihi</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {announcements?.map((announcement: Announcement) => (
            <TableRow key={announcement._id}>
              <TableCell>{announcement.title}</TableCell>
              <TableCell>{announcement.description}</TableCell>
              <TableCell>{formatDuration(announcement.duration)}</TableCell>
              <TableCell>{announcement.status}</TableCell>
              <TableCell>
                {new Date(announcement.createdAt).toLocaleDateString("tr-TR")}
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
                    <DropdownMenuItem>
                      <Calendar className="mr-2 h-4 w-4" />
                      Zamanla
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
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

export default AnnouncementList;