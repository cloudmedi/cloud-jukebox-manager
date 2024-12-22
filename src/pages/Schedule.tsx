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

const Schedule = () => {
  const [view, setView] = useState<"timeGridWeek" | "dayGridMonth">("timeGridWeek");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: schedules } = useQuery({
    queryKey: ["playlist-schedules"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/playlist-schedules");
      return response.json();
    },
  });

  const handleDateSelect = (selectInfo: any) => {
    setIsDialogOpen(true);
  };

  const events = schedules?.map((schedule: any) => ({
    id: schedule._id,
    title: `${schedule.playlist.name} - ${schedule.targets.devices.length > 0 ? 'Cihaz' : 'Grup'}`,
    start: schedule.startDate,
    end: schedule.endDate,
    backgroundColor: schedule.status === 'active' ? '#10b981' : '#6b7280',
  })) || [];

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

      <div className={`bg-background rounded-lg border p-4 ${view === "dayGridMonth" ? "monthly-view" : "weekly-view"}`}>
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
          slotMinTime={view === "timeGridWeek" ? "06:00:00" : undefined}
          slotMaxTime={view === "timeGridWeek" ? "24:00:00" : undefined}
          allDaySlot={view === "dayGridMonth"}
          dayHeaderFormat={view === "dayGridMonth" ? { weekday: 'short' } : { weekday: 'long' }}
          eventDisplay={view === "dayGridMonth" ? "block" : "auto"}
          eventTimeFormat={view === "dayGridMonth" ? 
            { hour: '2-digit', minute: '2-digit', hour12: false } : 
            { hour: '2-digit', minute: '2-digit', hour12: false }
          }
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Playlist Zamanla</DialogTitle>
          </DialogHeader>
          <PlaylistScheduleForm onSuccess={() => setIsDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        .monthly-view .fc-daygrid-day {
          min-height: 120px !important;
        }
        
        .monthly-view .fc-daygrid-day-frame {
          height: 100%;
        }

        .monthly-view .fc-daygrid-day-events {
          margin-bottom: 0;
        }

        .monthly-view .fc-event {
          margin: 1px 2px;
          padding: 2px 4px;
          font-size: 0.75rem;
          border-radius: 4px;
        }

        .weekly-view .fc-timegrid-slot {
          height: 40px !important;
        }

        .weekly-view .fc-event {
          margin: 0 2px;
          padding: 2px;
          font-size: 0.875rem;
        }

        .fc .fc-day-today {
          background-color: rgb(243 244 246) !important;
        }
      `}</style>
    </div>
  );
};

export default Schedule;