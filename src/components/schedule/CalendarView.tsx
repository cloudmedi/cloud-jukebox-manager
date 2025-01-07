import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { formatEventForCalendar } from "@/utils/scheduleUtils";
import { useToast } from "@/hooks/use-toast";
import trLocale from '@fullcalendar/core/locales/tr';
import { useMemo } from "react";
import { CalendarEventHandlers } from "./CalendarEventHandlers";
import { CalendarStyles } from "./CalendarStyles";
import { generatePastelColor } from "./utils/colorUtils";

interface CalendarViewProps {
  view: "timeGridWeek" | "dayGridMonth";
  onDateSelect: (selectInfo: any) => void;
  onEventClick: (clickInfo: any) => void;
}

export const CalendarView = ({ view, onDateSelect, onEventClick }: CalendarViewProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Renk eşleştirme için Map
  const playlistColorMap = useMemo(() => {
    const map = new Map();
    let colorIndex = 0;
    
    return (playlistId: string) => {
      if (!map.has(playlistId)) {
        const colors = generatePastelColor(colorIndex);
        map.set(playlistId, colors);
        colorIndex++;
      }
      return map.get(playlistId);
    };
  }, []);

  const { data: schedules, isLoading, error } = useQuery({
    queryKey: ["playlist-schedules"],
    queryFn: async () => {
      try {
        const response = await fetch("http://localhost:5000/api/playlist-schedules");
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Zamanlamalar alınamadı");
        }
        return response.json();
      } catch (error) {
        console.error("Veri çekme hatası:", error);
        throw new Error("Zamanlamalar yüklenirken bir hata oluştu. Lütfen internet bağlantınızı kontrol edin ve tekrar deneyin.");
      }
    },
    retry: 3, // 3 kez yeniden deneme
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Üstel geri çekilme
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, start, end }: { id: string; start: Date; end: Date }) => {
      console.log("Güncelleme yapılıyor:", { id, start, end });
      
      try {
        const response = await fetch(`http://localhost:5000/api/playlist-schedules/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            startDate: start.toISOString(),
            endDate: end.toISOString()
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Zamanlama güncellenemedi");
        }

        return response.json();
      } catch (error) {
        console.error("Güncelleme hatası:", error);
        throw error;
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
      console.error("Mutation hatası:", error);
      toast({
        title: "Hata",
        description: error.message || "Zamanlama güncellenirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  const handleEventDrop = async (dropInfo: any) => {
    console.log("Event düşürme bilgisi:", dropInfo);
    
    const { event } = dropInfo;
    const originalEventId = event.extendedProps.originalEventId;

    if (!originalEventId) {
      console.error("originalEventId bulunamadı:", event);
      dropInfo.revert();
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: originalEventId,
        start: event.start,
        end: event.end,
      });
    } catch (error) {
      console.error("Event düşürme hatası:", error);
      dropInfo.revert();
    }
  };

  const handleEventResize = async (resizeInfo: any) => {
    console.log("Event boyutlandırma bilgisi:", resizeInfo);
    
    const { event } = resizeInfo;
    const originalEventId = event.extendedProps.originalEventId;

    if (!originalEventId) {
      console.error("originalEventId bulunamadı:", event);
      resizeInfo.revert();
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: originalEventId,
        start: event.start,
        end: event.end,
      });
    } catch (error) {
      console.error("Event boyutlandırma hatası:", error);
      resizeInfo.revert();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-500 space-y-4">
        <p>Hata oluştu: {error instanceof Error ? error.message : 'Bilinmeyen hata'}</p>
        <button 
          onClick={() => queryClient.invalidateQueries({ queryKey: ["playlist-schedules"] })}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Yeniden Dene
        </button>
      </div>
    );
  }

  const events = schedules?.map((schedule: any) => {
    const colors = playlistColorMap(schedule.playlist._id);
    return {
      id: schedule._id,
      title: schedule.playlist.name,
      start: schedule.startDate,
      end: schedule.endDate,
      backgroundColor: colors.background,
      borderColor: colors.border,
      textColor: colors.textColor,
      classNames: ['event-animation'],
      extendedProps: {
        originalEventId: schedule._id,
        repeatType: schedule.repeatType,
        playlistId: schedule.playlist._id,
        status: schedule.status,
      }
    };
  }) || [];

  return (
    <div className="bg-background rounded-lg border p-4">
      <CalendarStyles />
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
        eventResize={handleEventResize}
        eventDraggable={true}
        eventStartEditable={true}
        eventDurationEditable={false}
        eventResizableFromStart={false}
        dragRevertDuration={0}
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
      />
    </div>
  );
};