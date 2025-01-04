import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { formatEventForCalendar } from "@/utils/scheduleUtils";
import { useToast } from "@/hooks/use-toast";
import trLocale from '@fullcalendar/core/locales/tr';

interface CalendarViewProps {
  view: "timeGridWeek" | "dayGridMonth";
  onDateSelect: (selectInfo: any) => void;
  onEventClick: (clickInfo: any) => void;
}

export const CalendarView = ({ view, onDateSelect, onEventClick }: CalendarViewProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: schedules, isLoading, error } = useQuery({
    queryKey: ["playlist-schedules"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/playlist-schedules");
      if (!response.ok) {
        throw new Error("Failed to fetch schedules");
      }
      return response.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, start, end }: { id: string; start: Date; end: Date }) => {
      const response = await fetch(`http://localhost:5000/api/playlist-schedules/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ startDate: start, endDate: end }),
      });

      if (!response.ok) {
        throw new Error("Zamanlama güncellenemedi");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlist-schedules"] });
      toast({
        title: "Başarılı",
        description: "Zamanlama güncellendi",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEventDrop = async (dropInfo: any) => {
    const { event } = dropInfo;
    const originalEventId = event.extendedProps.originalEventId;

    try {
      await updateMutation.mutateAsync({
        id: originalEventId,
        start: event.start,
        end: event.end,
      });
    } catch (error) {
      dropInfo.revert();
    }
  };

  const events = schedules?.flatMap((schedule: any) => formatEventForCalendar(schedule)) || [];

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Yükleniyor...</div>;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        Hata oluştu: {error instanceof Error ? error.message : 'Bilinmeyen hata'}
      </div>
    );
  }

  return (
    <div className="bg-background rounded-lg border p-4">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView={view}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek'
        }}
        locale={trLocale}
        firstDay={1}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        events={events}
        select={onDateSelect}
        eventClick={onEventClick}
        height="auto"
        nowIndicator={true}
        slotMinTime="00:00:00"
        slotMaxTime="24:00:00"
        selectOverlap={false}
        editable={true}
        eventDrop={handleEventDrop}
        eventTimeFormat={{
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }}
        slotLabelFormat={{
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }}
        selectConstraint={{
          start: '00:00',
          end: '24:00',
          dows: [0, 1, 2, 3, 4, 5, 6]
        }}
        allDaySlot={false}
        dayMaxEventRows={true}
        eventDidMount={(info) => {
          if (info.event.extendedProps?.tooltip) {
            const tooltip = document.createElement('div');
            tooltip.className = 'bg-background border rounded-md shadow-lg p-2 text-sm';
            tooltip.innerHTML = info.event.extendedProps.tooltip.replace('\n', '<br/>');
            
            info.el.addEventListener('mouseover', () => {
              document.body.appendChild(tooltip);
              const rect = info.el.getBoundingClientRect();
              tooltip.style.position = 'fixed';
              tooltip.style.top = `${rect.bottom + 5}px`;
              tooltip.style.left = `${rect.left}px`;
              tooltip.style.zIndex = '10000';
            });

            info.el.addEventListener('mouseout', () => {
              if (document.body.contains(tooltip)) {
                document.body.removeChild(tooltip);
              }
            });
          }
        }}
      />
    </div>
  );
};