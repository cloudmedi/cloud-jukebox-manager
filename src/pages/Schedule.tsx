import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PlaylistScheduleForm } from "@/components/schedule/PlaylistScheduleForm";
import { EventDetailDialog } from "@/components/schedule/EventDetailDialog";
import { CalendarView } from "@/components/schedule/CalendarView";
import { ViewToggle } from "@/components/schedule/ViewToggle";
import { useQueryClient } from "@tanstack/react-query";

export default function Schedule() {
  const [view, setView] = useState<"timeGridWeek" | "dayGridMonth">("timeGridWeek");
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedDates, setSelectedDates] = useState<{
    start: Date | null;
    end: Date | null;
  }>({ start: null, end: null });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEventDetailOpen, setIsEventDetailOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const queryClient = useQueryClient();

  const handleEventClick = (event: any) => {
    setSelectedEvent(event);
    setSelectedDates({
      start: event.start,
      end: event.end
    });
    setIsDialogOpen(true);
  };

  const handleDateSelect = (selectInfo: any) => {
    setSelectedEvent(null);
    setSelectedDates({
      start: selectInfo.start,
      end: selectInfo.end
    });
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedEvent(null);
    setSelectedDates({ start: null, end: null });
  };

  const handleScheduleCreated = () => {
    // Dialog'u kapat
    setIsDialogOpen(false);
    
    // Takvim verilerini yenile
    queryClient.invalidateQueries({ queryKey: ["playlist-schedules"] });
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Zamanlama</h2>
        <ViewToggle view={view} onViewChange={setView} />
      </div>

      <CalendarView 
        view={view}
        onDateSelect={handleDateSelect}
        onEventClick={handleEventClick}
        refreshTrigger={refreshTrigger}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Playlist Zamanla</DialogTitle>
          </DialogHeader>
          <PlaylistScheduleForm 
            onSuccess={handleScheduleCreated}
            initialStartDate={selectedDates.start}
            initialEndDate={selectedDates.end}
            isEditing={!!selectedEvent}
            initialData={selectedEvent}
            onClose={handleDialogClose}
          />
        </DialogContent>
      </Dialog>

      <EventDetailDialog 
        event={selectedEvent}
        isOpen={isEventDetailOpen}
        onClose={() => {
          setIsEventDetailOpen(false);
          setSelectedEvent(null);
          // Event detayı kapatıldığında da yenile
          setRefreshTrigger(prev => prev + 1);
        }}
      />
    </div>
  );
};