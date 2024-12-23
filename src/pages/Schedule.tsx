import { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Button } from "@/components/ui/button";
import { Calendar, List } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PlaylistScheduleForm } from "@/components/schedule/PlaylistScheduleForm";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

const Schedule = () => {
  const [view, setView] = useState<"timeGridWeek" | "dayGridMonth">("timeGridWeek");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { data: schedules, isLoading } = useQuery({
    queryKey: ["playlist-schedules"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/playlist-schedules");
      if (!response.ok) {
        throw new Error("Zamanlamalar yüklenirken bir hata oluştu");
      }
      return response.json();
    },
  });

  const handleDateSelect = (selectInfo: any) => {
    const selectedDate = new Date(selectInfo.start);
    // Seçilen tarihin saat bilgisini koru
    const hours = selectedDate.getHours();
    const minutes = selectedDate.getMinutes();
    
    // Eğer saat 0:00 ise, varsayılan olarak şu anki saati kullan
    if (hours === 0 && minutes === 0) {
      const now = new Date();
      selectedDate.setHours(now.getHours(), now.getMinutes());
    }
    
    setSelectedDate(selectedDate);
    setIsDialogOpen(true);
  };

  const handleScheduleCreate = async () => {
    setIsDialogOpen(false);
    toast.success("Zamanlama başarıyla oluşturuldu");
  };

  const events = schedules?.map((schedule: any) => ({
    id: schedule._id,
    title: `${schedule.playlist.name} - ${
      schedule.targets.devices.length > 0 ? 'Cihaz' : 'Grup'
    }`,
    start: schedule.startDate,
    end: schedule.endDate,
    backgroundColor: schedule.status === 'active' ? '#10b981' : '#6b7280',
    borderColor: schedule.status === 'active' ? '#059669' : '#4b5563',
    textColor: '#ffffff',
    extendedProps: {
      devices: schedule.targets.devices,
      groups: schedule.targets.groups,
      repeatType: schedule.repeatType,
      status: schedule.status
    }
  })) || [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Zamanlama</h2>
        <div className="flex items-center gap-2">
          <Button
            variant={view === "timeGridWeek" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("timeGridWeek")}
          >
            <List className="h-4 w-4 mr-2" />
            Haftalık
          </Button>
          <Button
            variant={view === "dayGridMonth" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("dayGridMonth")}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Aylık
          </Button>
        </div>
      </div>

      <div className="bg-background rounded-lg border p-4">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={view}
          headerToolbar={{
            left: '',
            center: 'title',
            right: ''
          }}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          events={events}
          select={handleDateSelect}
          height="auto"
          locale="tr"
          slotMinTime="00:00:00"
          slotMaxTime="24:00:00"
          allDaySlot={false}
          eventContent={(eventInfo) => {
            return (
              <div className="p-1">
                <div className="font-semibold">{eventInfo.event.title}</div>
                <div className="text-xs">
                  {eventInfo.event.extendedProps.repeatType === 'once' ? 'Bir Kez' :
                   eventInfo.event.extendedProps.repeatType === 'daily' ? 'Günlük' :
                   eventInfo.event.extendedProps.repeatType === 'weekly' ? 'Haftalık' : 'Aylık'}
                </div>
              </div>
            );
          }}
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Playlist Zamanla</DialogTitle>
            <DialogDescription>
              Seçilen tarih: {selectedDate ? format(selectedDate, "dd MMM yyyy HH:mm", { locale: tr }) : ""}
            </DialogDescription>
          </DialogHeader>
          <PlaylistScheduleForm 
            initialDate={selectedDate} 
            onSuccess={handleScheduleCreate} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Schedule;