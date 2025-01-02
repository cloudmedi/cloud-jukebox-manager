import { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Button } from "@/components/ui/button";
import { Calendar, List, Search, Filter } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PlaylistScheduleForm } from "@/components/schedule/PlaylistScheduleForm";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const Schedule = () => {
  const [view, setView] = useState<"timeGridWeek" | "dayGridMonth">("timeGridWeek");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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
      className: cn(
        'rounded-lg shadow-sm border-l-4 p-2 transition-all hover:shadow-md',
        schedule.status === 'active' 
          ? 'border-emerald-500 bg-emerald-50/50' 
          : 'border-gray-400 bg-gray-50/50'
      ),
      extendedProps: {
        status: schedule.status,
        targets: schedule.targets
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-lg shadow-sm">
        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          Zamanlama
        </h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Zamanlamalarda ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full sm:w-[200px]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={view === "timeGridWeek" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("timeGridWeek")}
              className="flex-1 sm:flex-none"
            >
              <List className="h-4 w-4 mr-2" />
              Haftalık
            </Button>
            <Button
              variant={view === "dayGridMonth" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("dayGridMonth")}
              className="flex-1 sm:flex-none"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Aylık
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm p-4">
        <style>
          {`
            .fc-timegrid-now-indicator-line {
              border: 0;
              height: 2px;
              background: linear-gradient(90deg, rgba(139,92,246,0) 0%, rgb(139,92,246) 50%, rgba(139,92,246,0) 100%);
              box-shadow: 0 0 8px rgba(139,92,246,0.4);
            }
            
            .fc-timegrid-now-indicator-arrow {
              display: none;
            }

            .fc-event {
              border: none !important;
              padding: 2px 4px;
            }

            .fc-event:hover {
              transform: translateY(-1px);
            }

            .fc-toolbar-title {
              font-size: 1.1rem !important;
              font-weight: 600;
            }

            .fc-button {
              background: white !important;
              border: 1px solid #e2e8f0 !important;
              color: #64748b !important;
            }

            .fc-button:hover {
              background: #f8fafc !important;
            }

            .fc-button-active {
              background: #f1f5f9 !important;
              border-color: #cbd5e1 !important;
            }

            .fc-timegrid-slot {
              height: 48px !important;
            }

            .fc-timegrid-slot-label {
              font-size: 0.875rem;
              color: #64748b;
            }

            .fc-day-today {
              background: #faf5ff !important;
            }
          `}
        </style>
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
        />
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