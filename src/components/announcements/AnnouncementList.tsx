import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Volume2, Clock, Users, Calendar } from "lucide-react";
import { AnnouncementActions } from "./AnnouncementActions";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

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
    <div className="space-y-6">
      <ScrollArea className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-1">
          {announcements.map((announcement: any) => (
            <Card key={announcement._id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{announcement.title}</h3>
                    <p className="text-sm text-muted-foreground">{announcement.content}</p>
                  </div>
                  <AnnouncementActions announcement={announcement} />
                </div>

                {/* Schedule Type */}
                <div className="flex items-center gap-2 text-sm">
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

                {/* Date Range */}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4" />
                  <div className="flex flex-col">
                    <span>
                      Başlangıç: {format(new Date(announcement.startDate), "dd.MM.yyyy HH:mm")}
                    </span>
                    <span>
                      Bitiş: {format(new Date(announcement.endDate), "dd.MM.yyyy HH:mm")}
                    </span>
                  </div>
                </div>

                {/* Targets */}
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4" />
                  <span>
                    {announcement.targetDevices?.length || 0} Cihaz,{" "}
                    {announcement.targetGroups?.length || 0} Grup
                  </span>
                </div>

                {/* Status */}
                <div className="flex justify-end">
                  {getStatusBadge(announcement.status)}
                </div>
              </div>
            </Card>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};