import { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Button } from "@/components/ui/button";
import { Calendar, List } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PlaylistScheduleForm } from "@/components/schedule/PlaylistScheduleForm";

const Schedule = () => {
  const [view, setView] = useState<"timeGridWeek" | "dayGridMonth">("timeGridWeek");

  const handleDateSelect = (selectInfo: any) => {
    const dialog = document.getElementById("schedule-dialog") as HTMLButtonElement;
    if (dialog) dialog.click();
  };

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
          select={handleDateSelect}
          height="auto"
          locale="tr"
        />
      </div>

      <Dialog>
        <DialogTrigger id="schedule-dialog" className="hidden">
          Open
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Playlist Zamanla</DialogTitle>
          </DialogHeader>
          <PlaylistScheduleForm />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Schedule;