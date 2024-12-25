import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Volume2, Clock, Users } from "lucide-react";
import { AnnouncementActions } from "./AnnouncementActions";
import { ScrollArea } from "@/components/ui/scroll-area";

export const AnnouncementList = () => {
  const { data: announcements = [] } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/announcements");
      if (!response.ok) throw new Error("Anonslar yüklenemedi");
      return response.json();
    },
  });

  const getScheduleTypeText = (type: string) => {
    switch (type) {
      case "songs":
        return "Şarkı Bazlı";
      case "minutes":
        return "Dakika Bazlı";
      case "specific":
        return "Belirli Saatler";
      default:
        return type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Aktif</Badge>;
      case "inactive":
        return <Badge variant="secondary">Pasif</Badge>;
      case "completed":
        return <Badge variant="outline">Tamamlandı</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <ScrollArea className="h-[calc(100vh-12rem)] w-full rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Başlık</TableHead>
            <TableHead>Zamanlama Türü</TableHead>
            <TableHead>Başlangıç</TableHead>
            <TableHead>Bitiş</TableHead>
            <TableHead>Hedefler</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead className="text-right">İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {announcements.map((announcement: any) => (
            <TableRow key={announcement._id}>
              <TableCell className="font-medium">
                <div>
                  <p className="font-semibold">{announcement.title}</p>
                  <p className="text-sm text-muted-foreground">{announcement.content}</p>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {announcement.scheduleType === "songs" ? (
                    <Volume2 className="w-4 h-4" />
                  ) : announcement.scheduleType === "minutes" ? (
                    <Clock className="w-4 h-4" />
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                  <span>
                    {getScheduleTypeText(announcement.scheduleType)}
                    {announcement.songInterval && ` (${announcement.songInterval} şarkıda bir)`}
                    {announcement.minuteInterval && ` (${announcement.minuteInterval} dakikada bir)`}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                {format(new Date(announcement.startDate), "dd.MM.yyyy HH:mm")}
              </TableCell>
              <TableCell>
                {format(new Date(announcement.endDate), "dd.MM.yyyy HH:mm")}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>
                    {announcement.targetDevices?.length || 0} Cihaz,{" "}
                    {announcement.targetGroups?.length || 0} Grup
                  </span>
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(announcement.status)}</TableCell>
              <TableCell className="text-right">
                <AnnouncementActions announcement={announcement} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
};