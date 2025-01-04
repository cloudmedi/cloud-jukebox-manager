import { addDays, addWeeks, addMonths, isBefore, parseISO } from "date-fns";
import { tr } from "date-fns/locale";

export interface RecurringEvent {
  _id: string;
  startDate: string | Date;
  endDate: string | Date;
  repeatType: "once" | "daily" | "weekly" | "monthly";
  playlist: {
    _id: string;
    name: string;
  };
  status: string;
}

export const generateRecurringEvents = (event: RecurringEvent, until: Date) => {
  const events = [];
  const start = typeof event.startDate === 'string' ? parseISO(event.startDate) : event.startDate;
  const end = typeof event.endDate === 'string' ? parseISO(event.endDate) : event.endDate;
  const duration = end.getTime() - start.getTime();

  let currentStart = start;
  let currentEnd = end;

  // Maksimum 100 tekrar ile sınırla
  let maxRecurrences = 100;
  let recurrenceCount = 0;

  while (isBefore(currentStart, until) && recurrenceCount < maxRecurrences) {
    events.push({
      id: `${event._id}-${recurrenceCount}`,
      title: event.playlist.name,
      start: currentStart,
      end: currentEnd,
      backgroundColor: event.status === 'active' ? '#E5DEFF' : '#FDE1D3',
      borderColor: event.status === 'active' ? '#E5DEFF' : '#FDE1D3',
      textColor: '#222222',
      extendedProps: {
        originalEventId: event._id,
        recurrenceIndex: recurrenceCount,
        repeatType: event.repeatType,
        playlistId: event.playlist._id,
        status: event.status
      }
    });

    // Bir sonraki tekrarı hesapla
    switch (event.repeatType) {
      case 'daily':
        currentStart = addDays(currentStart, 1);
        currentEnd = addDays(currentEnd, 1);
        break;
      case 'weekly':
        currentStart = addWeeks(currentStart, 1);
        currentEnd = addWeeks(currentEnd, 1);
        break;
      case 'monthly':
        currentStart = addMonths(currentStart, 1);
        currentEnd = addMonths(currentEnd, 1);
        break;
      default:
        // 'once' için sadece tek event oluştur
        return events;
    }

    recurrenceCount++;
  }

  return events;
};

export const formatEventForCalendar = (schedule: RecurringEvent) => {
  const now = new Date();
  // 1 yıl sonrasına kadar olan tekrarları göster
  const futureDate = addMonths(now, 12);
  
  if (schedule.repeatType === 'once') {
    return [{
      id: schedule._id,
      title: schedule.playlist.name,
      start: schedule.startDate,
      end: schedule.endDate,
      backgroundColor: schedule.status === 'active' ? '#E5DEFF' : '#FDE1D3',
      borderColor: schedule.status === 'active' ? '#E5DEFF' : '#FDE1D3',
      textColor: '#222222',
      extendedProps: {
        originalEventId: schedule._id,
        repeatType: schedule.repeatType,
        playlistId: schedule.playlist._id,
        status: schedule.status
      }
    }];
  }

  return generateRecurringEvents(schedule, futureDate);
};