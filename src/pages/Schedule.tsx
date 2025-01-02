import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PlaylistScheduleForm } from "@/components/schedule/PlaylistScheduleForm";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ScheduleHeader } from "@/components/schedule/ScheduleHeader";
import { ScheduleCalendar } from "@/components/schedule/ScheduleCalendar";

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
      <ScheduleHeader view={view} setView={setView} />
      <ScheduleCalendar 
        view={view}
        events={events}
        onDateSelect={handleDateSelect}
      />

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