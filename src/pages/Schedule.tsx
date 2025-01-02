import { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Button } from "@/components/ui/button";
import { Calendar, List } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PlaylistScheduleForm } from "@/components/schedule/PlaylistScheduleForm";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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

const Schedule = () => {
  const [view, setView] = useState<"timeGridWeek" | "dayGridMonth">("timeGridWeek");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDates, setSelectedDates] = useState<{
    start: Date | null;
    end: Date | null;
  }>({ start: null, end: null });

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

  const events = schedules?.map(schedule => {
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
      backgroundColor: schedule.status === 'active' ? '#10b981' : '#6b7280',
      borderColor: schedule.status === 'active' ? '#059669' : '#4b5563',
      textColor: '#ffffff',
      classNames: ['rounded-md', 'shadow-sm', 'border', 'hover:opacity-90', 'transition-opacity'],
    };
  }).filter(Boolean) || [];

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
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
      <div className="flex items-center justify-center h-[600px] text-destructive">
        <p>Failed to load schedules. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">Zamanlama</h2>
        <div className="flex items-center gap-2">
          <Button
            variant={view === "timeGridWeek" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("timeGridWeek")}
            className={cn(
              "transition-colors",
              view === "timeGridWeek" && "bg-primary text-primary-foreground shadow-sm"
            )}
          >
            <List className="h-4 w-4 mr-2" />
            Haftalık
          </Button>
          <Button
            variant={view === "dayGridMonth" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("dayGridMonth")}
            className={cn(
              "transition-colors",
              view === "dayGridMonth" && "bg-primary text-primary-foreground shadow-sm"
            )}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Aylık
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-lg border shadow-sm">
        <div className="p-4">
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
            allDaySlot={false}
            slotEventOverlap={false}
            eventDisplay="block"
            slotLaneClassNames="bg-background hover:bg-muted/50 transition-colors"
            dayHeaderClassNames="text-sm font-medium text-muted-foreground"
            slotLabelClassNames="text-sm text-muted-foreground"
            dayCellClassNames="hover:bg-muted/50 transition-colors"
            eventClassNames="rounded-md shadow-sm border hover:opacity-90 transition-opacity"
          />
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Playlist Zamanla</DialogTitle>
          </DialogHeader>
          <PlaylistScheduleForm 
            onSuccess={() => setIsDialogOpen(false)}
            initialStartDate={selectedDates.start}
            initialEndDate={selectedDates.end}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Schedule;