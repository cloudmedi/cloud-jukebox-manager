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

// Genişletilmiş renk paleti
const colorPalette = [
  // Ana renkler (Canlı)
  '#9b87f5',   // Mor
  '#F97316',   // Turuncu
  '#0EA5E9',   // Mavi
  '#D946EF',   // Pembe
  '#22C55E',   // Yeşil
  '#EF4444',   // Kırmızı
  '#F59E0B',   // Amber
  
  // Pastel tonlar
  '#E5DEFF',   // Pastel Mor
  '#FDE1D3',   // Pastel Turuncu
  '#D3E4FD',   // Pastel Mavi
  '#FFDEE2',   // Pastel Pembe
  '#F2FCE2',   // Pastel Yeşil
  '#FEF7CD',   // Pastel Sarı
  '#FEC6A1',   // Pastel Şeftali
  
  // Koyu tonlar
  '#6E59A5',   // Koyu Mor
  '#C2410C',   // Koyu Turuncu
  '#0369A1',   // Koyu Mavi
  '#A21CAF',   // Koyu Pembe
  '#15803D',   // Koyu Yeşil
  '#991B1B',   // Koyu Kırmızı
  '#B45309'    // Koyu Amber
];

const Schedule = () => {
  const [view, setView] = useState<"timeGridWeek" | "dayGridMonth">("timeGridWeek");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDates, setSelectedDates] = useState<{
    start: Date | null;
    end: Date | null;
  }>({ start: null, end: null });

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

  const handleScheduleCreated = () => {
    setIsDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ["playlist-schedules"] });
  };

  const getScheduleColor = (index: number) => {
    return colorPalette[index % colorPalette.length];
  };

  const events = schedules?.map((schedule, index) => {
    if (!schedule?.playlist) {
      return null;
    }

    return {
      id: schedule._id,
      title: `${schedule.playlist.name || 'Unnamed Playlist'} - ${
        Array.isArray(schedule.targets?.devices) && schedule.targets.devices.length > 0 
          ? 'Cihaz' 
          : 'Grup'
      }`,
      start: schedule.startDate,
      end: schedule.endDate,
      backgroundColor: getScheduleColor(index),
      borderColor: getScheduleColor(index),
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
    </div>
  );
};

export default Schedule;