import { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Button } from "@/components/ui/button";
import { Calendar, List } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PlaylistScheduleForm } from "@/components/schedule/PlaylistScheduleForm";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { EventDetailDialog } from "@/components/schedule/EventDetailDialog";

interface Schedule {
  _id: string;
  playlist: {
    _id: string;
    name: string;
  } | null;
  startDate: string;
  endDate: string;
  status: 'active' | 'inactive';
  targets: {
    devices: string[];
    groups: string[];
  };
}

// Sadece pastel renklerden oluşan palet
const colorPalette = [
  '#E5DEFF',   // Pastel Mor
  '#FDE1D3',   // Pastel Turuncu
  '#D3E4FD',   // Pastel Mavi
  '#FFDEE2',   // Pastel Pembe
  '#F2FCE2',   // Pastel Yeşil
  '#FEF7CD',   // Pastel Sarı
  '#FEC6A1',   // Pastel Şeftali
  '#FFE4E1',   // Pastel Gül
  '#E0FFFF',   // Pastel Turkuaz
  '#F0FFF0',   // Pastel Nane
  '#FFF0F5',   // Pastel Lavanta
  '#F5F5DC',   // Pastel Bej
];

const Schedule = () => {
  const [view, setView] = useState<"timeGridWeek" | "dayGridMonth">("timeGridWeek");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDates, setSelectedDates] = useState<{
    start: Date | null;
    end: Date | null;
  }>({ start: null, end: null });
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isEventDetailOpen, setIsEventDetailOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data: schedules, isLoading, error } = useQuery({
    queryKey: ["playlist-schedules"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/playlist-schedules");
      if (!response.ok) {
        throw new Error("Failed to fetch schedules");
      }
      const data = await response.json();
      console.log("Loaded schedules:", data);
      return data;
    },
  });

  const handleDateSelect = (selectInfo: any) => {
    setSelectedDates({
      start: selectInfo.start,
      end: selectInfo.end
    });
    setIsDialogOpen(true);
  };

  const handleEventClick = (clickInfo: any) => {
    setSelectedEvent(clickInfo.event);
    setIsEventDetailOpen(true);
  };

  const handleScheduleCreated = () => {
    setIsDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ["playlist-schedules"] });
  };

  const getScheduleColor = (index: number) => {
    return colorPalette[index % colorPalette.length];
  };

  const events = schedules?.map((schedule: Schedule, index: number) => {
    if (!schedule?.playlist) {
      return null;
    }

    const backgroundColor = getScheduleColor(index);
    const targetType = Array.isArray(schedule.targets?.devices) && schedule.targets.devices.length > 0 
      ? 'device' 
      : 'group';
    
    return {
      id: schedule._id,
      title: schedule.playlist.name || 'İsimsiz Playlist',
      start: schedule.startDate,
      end: schedule.endDate,
      backgroundColor: backgroundColor,
      borderColor: backgroundColor,
      textColor: '#222222',
      extendedProps: {
        targetType: targetType,
        playlistId: schedule.playlist._id
      }
    };
  }).filter(Boolean) || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <p className="text-destructive">Failed to load schedules. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
          headerToolbar={false}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          events={events}
          select={handleDateSelect}
          eventClick={handleEventClick}
          height="auto"
          locale="tr"
          nowIndicator={true}
          slotMinTime="00:00:00"
          slotMaxTime="24:00:00"
          selectOverlap={false}
          selectConstraint={{
            start: '00:00',
            end: '24:00',
            dows: [0, 1, 2, 3, 4, 5, 6]
          }}
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Playlist Zamanla</DialogTitle>
          </DialogHeader>
          <PlaylistScheduleForm 
            onSuccess={handleScheduleCreated}
            initialStartDate={selectedDates.start}
            initialEndDate={selectedDates.end}
          />
        </DialogContent>
      </Dialog>

      <EventDetailDialog 
        event={selectedEvent}
        isOpen={isEventDetailOpen}
        onClose={() => {
          setIsEventDetailOpen(false);
          setSelectedEvent(null);
        }}
      />
    </div>
  );
};

export default Schedule;