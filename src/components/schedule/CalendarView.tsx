import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { formatEventForCalendar } from "@/utils/scheduleUtils";
import { useToast } from "@/hooks/use-toast";
import trLocale from '@fullcalendar/core/locales/tr';
import { useMemo } from "react";

// HSL renk uzayını kullanarak renk üretme fonksiyonu
const generatePastelColor = (index: number) => {
  // Altın oran kullanarak renk dağılımı (daha estetik görünüm için)
  const goldenRatio = 0.618033988749895;
  
  // Her yeni renk için hue değerini altın orana göre kaydır
  const hue = (index * goldenRatio * 360) % 360;
  
  // Pastel renkler için orta saturation ve yüksek lightness
  const saturation = 55 + (index % 10); // %55-%65 arası
  const lightness = 80 + (index % 8);   // %80-%88 arası
  
  // Border için yumuşak kontrast
  const background = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  const border = `hsl(${hue}, ${Math.min(saturation + 5, 100)}%, ${Math.max(lightness - 10, 0)}%)`;
  
  // Yumuşak metin rengi
  const textColor = `hsl(${hue}, 70%, 30%)`; // Tüm zeminler için okunabilir orta ton
  
  return { 
    background,
    border,
    textColor
  };
};

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
        console.error("Fetch error:", error);
        throw error;
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, start, end }: { id: string; start: Date; end: Date }) => {
      console.log("Updating event:", { id, start, end });
      
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

        const updatedData = await response.json();
        console.log("Update successful:", updatedData);
        return updatedData;
      } catch (error) {
        console.error("Update error:", error);
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
      console.error("Mutation error:", error);
      toast({
        title: "Hata",
        description: error.message || "Zamanlama güncellenirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  const handleEventDrop = async (dropInfo: any) => {
    console.log("Event drop info:", dropInfo);
    
    const { event } = dropInfo;
    const originalEventId = event.extendedProps.originalEventId;

    if (!originalEventId) {
      console.error("No originalEventId found:", event);
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
      console.error("Event drop error:", error);
      dropInfo.revert();
    }
  };

  const handleEventResize = async (resizeInfo: any) => {
    console.log("Event resize info:", resizeInfo);
    
    const { event } = resizeInfo;
    const originalEventId = event.extendedProps.originalEventId;

    if (!originalEventId) {
      console.error("No originalEventId found:", event);
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
      console.error("Event resize error:", error);
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
      <div className="flex items-center justify-center h-64 text-red-500">
        Hata oluştu: {error instanceof Error ? error.message : 'Bilinmeyen hata'}
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
      <style>
        {`
          .event-animation {
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            cursor: pointer;
            position: relative;
          }
          
          .event-animation:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
          }
          
          .fc-event {
            border-radius: 6px;
            border-left-width: 4px;
            overflow: hidden;
          }
          
          .fc-timegrid-event-harness {
            margin: 2px 3px;
          }
          
          .fc-timegrid-event {
            min-height: 30px !important;
            padding: 4px 6px;
          }
          
          .fc-event-main {
            padding: 6px 8px;
          }
          
          .fc-event-time {
            font-weight: 500;
          }
          
          .fc-event-title {
            font-weight: 400;
            margin-top: 2px;
          }
          
          /* Resize handle styles */
          .fc-event .fc-event-resizer {
            width: 100%;
            height: 6px;
            background: rgba(255, 255, 255, 0.2);
            position: absolute;
            left: 0;
            opacity: 0;
            transition: opacity 0.2s ease;
          }
          
          .fc-event .fc-event-resizer-start {
            top: 0;
            border-top-left-radius: 6px;
            border-top-right-radius: 6px;
          }
          
          .fc-event .fc-event-resizer-end {
            bottom: 0;
            border-bottom-left-radius: 6px;
            border-bottom-right-radius: 6px;
          }
          
          .fc-event:hover .fc-event-resizer {
            opacity: 1;
          }
          
          .fc-event.fc-event-dragging,
          .fc-event.fc-event-resizing {
            z-index: 100;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          }
        `}
      </style>
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
        selectOverlap={true}
        editable={true}
        eventDrop={handleEventDrop}
        eventResize={handleEventResize}
        eventDraggable={true}
        eventStartEditable={true}
        eventDurationEditable={true}
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
