import { FC, useEffect, useState } from 'react';
import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useQuery } from '@tanstack/react-query';

interface CalendarViewProps {
  onDateSelect: (selectInfo: any) => void;
  onEventClick: (event: any) => void;
  refreshTrigger: number;
  view?: "timeGridWeek" | "dayGridMonth";
}

export const CalendarView: FC<CalendarViewProps> = ({
  onDateSelect,
  onEventClick,
  refreshTrigger,
  view = "timeGridWeek"
}) => {
  const [calendar, setCalendar] = useState<Calendar | null>(null);

  const { data: events = [] } = useQuery({
    queryKey: ['schedule-events', refreshTrigger],
    queryFn: async () => {
      const response = await fetch('http://localhost:5000/api/schedule');
      if (!response.ok) throw new Error('Failed to fetch events');
      return response.json();
    }
  });

  useEffect(() => {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) return;

    const newCalendar = new Calendar(calendarEl, {
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
      initialView: view,
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek'
      },
      editable: true,
      selectable: true,
      selectMirror: true,
      dayMaxEvents: true,
      weekends: true,
      select: onDateSelect,
      eventClick: onEventClick,
      events: events.map((event: any) => ({
        id: event._id,
        title: event.title,
        start: event.startDate,
        end: event.endDate,
        backgroundColor: event.color || '#3788d8',
        borderColor: event.color || '#3788d8'
      }))
    });

    newCalendar.render();
    setCalendar(newCalendar);

    return () => {
      newCalendar.destroy();
    };
  }, [events, onDateSelect, onEventClick, view]);

  useEffect(() => {
    if (calendar) {
      calendar.changeView(view);
    }
  }, [calendar, view]);

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div id="calendar" className="fc-theme-standard" />
    </div>
  );
};

export default CalendarView;