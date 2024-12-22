import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Play, Pencil, Trash, MoreVertical } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import AnnouncementForm from "./AnnouncementForm";

interface Announcement {
  _id: string;
  title: string;
  content: string;
  audioFile: string;
  duration: number;
  status: string;
  startDate: string;
  endDate: string;
  scheduleType: string;
  createdAt: string;
}

const AnnouncementList = () => {
  const { toast } = useToast();
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: announcements, isLoading, error } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      try {
        const response = await fetch("http://localhost:5000/api/announcements");
        if (!response.ok) {
          throw new Error("API yanıt vermedi");
        }
        return response.json();
      } catch (error) {
        console.error("Veri çekme hatası:", error);
        throw new Error("Anonslar yüklenirken hata oluştu");
      }
    },
    retry: 1,
  });

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/announcements/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Silme işlemi başarısız");

      toast({
        title: "Başarılı",
        description: "Anons başarıyla silindi",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Anons silinirken bir hata oluştu",
      });
    }
  };

  const formatDuration = (duration: number) => {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return <div>Yükleniyor...</div>;
  }

  if (error) {
    return (
      <div className="text-center p-4 text-red-500">
        Anonslar yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Başlık</TableHead>
              <TableHead>Açıklama</TableHead>
              <TableHead>Süre</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Başlangıç</TableHead>
              <TableHead>Bitiş</TableHead>
              <TableHead>Tekrar</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {announcements?.map((announcement: Announcement) => (
              <TableRow key={announcement._id}>
                <TableCell>{announcement.title}</TableCell>
                <TableCell>{announcement.content}</TableCell>
                <TableCell>{formatDuration(announcement.duration)}</TableCell>
                <TableCell>{announcement.status}</TableCell>
                <TableCell>
                  {new Date(announcement.startDate).toLocaleDateString("tr-TR")}
                </TableCell>
                <TableCell>
                  {new Date(announcement.endDate).toLocaleDateString("tr-TR")}
                </TableCell>
                <TableCell>{announcement.scheduleType}</TableCell>
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
                      <DropdownMenuItem onClick={() => {
                        setSelectedAnnouncement(announcement);
                        setIsEditDialogOpen(true);
                      }}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Düzenle
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(announcement._id)}>
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

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Anons Düzenle</DialogTitle>
          </DialogHeader>
          <AnnouncementForm 
            announcement={selectedAnnouncement} 
            onSuccess={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AnnouncementList;