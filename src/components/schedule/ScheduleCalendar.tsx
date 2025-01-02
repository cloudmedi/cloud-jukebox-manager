import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { cn } from "@/lib/utils";

interface ScheduleCalendarProps {
  view: "timeGridWeek" | "dayGridMonth";
  events: any[];
  onDateSelect: (selectInfo: any) => void;
}

export const ScheduleCalendar = ({ view, events, onDateSelect }: ScheduleCalendarProps) => {
  return (
    <div className="bg-white rounded-lg border shadow-sm p-4">
      <style>
        {`
          .fc-timegrid-slot {
            height: 48px !important;
          }

          .fc-timegrid-slot-label {
            font-size: 0.875rem;
            color: #64748b;
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

          .fc-event {
            border: none !important;
            padding: 2px 4px;
          }

          .fc-event:hover {
            transform: translateY(-1px);
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
        select={onDateSelect}
        height="auto"
        locale="tr"
        nowIndicator={true}
        slotMinTime="00:00:00"
        slotMaxTime="24:00:00"
        allDaySlot={false}
        slotEventOverlap={false}
      />
    </div>
  );
};