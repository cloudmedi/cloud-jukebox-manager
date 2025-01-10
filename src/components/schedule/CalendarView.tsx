import { useState } from 'react';
import { format, parse, startOfWeek, endOfWeek, startOfDay, endOfDay, eachDayOfInterval, addDays, isSameDay, isWithinInterval, addWeeks, subWeeks } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type ViewType = 'week' | 'day' | 'month';
type RepeatType = 'daily' | 'weekly' | 'monthly';

interface Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color?: string;
}

interface CalendarViewProps {
  events?: Event[];
  onEventClick?: (event: Event) => void;
  onDateSelect?: (date: Date) => void;
}

export function CalendarView({ events = [], onEventClick, onDateSelect }: CalendarViewProps) {
  const [view, setView] = useState<ViewType>('week');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [repeatType, setRepeatType] = useState<RepeatType>('weekly');

  const handleViewChange = (newView: ViewType) => {
    setView(newView);
  };

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    onDateSelect?.(date);
  };

  const convertToDate = (stringDate: string | Date): Date => {
    return typeof stringDate === 'string' ? new Date(stringDate) : stringDate;
  };

  const getWeekDays = (date: Date) => {
    const start = startOfWeek(date, { weekStartsOn: 1 });
    return eachDayOfInterval({
      start,
      end: endOfWeek(date, { weekStartsOn: 1 })
    });
  };

  const weekDays = getWeekDays(selectedDate);

  const getEventsForDay = (date: Date) => {
    return events.filter(event => {
      const eventStart = convertToDate(event.start);
      const eventEnd = convertToDate(event.end);
      return isWithinInterval(date, { start: startOfDay(eventStart), end: endOfDay(eventEnd) });
    });
  };

  const handlePrevWeek = () => {
    setSelectedDate(subWeeks(selectedDate, 1));
  };

  const handleNextWeek = () => {
    setSelectedDate(addWeeks(selectedDate, 1));
  };

  const timeSlots = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevWeek}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextWeek}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="text-lg font-semibold">
            {format(weekDays[0], 'MMMM yyyy')}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Select
            value={repeatType}
            onValueChange={(value: RepeatType) => setRepeatType(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tekrar tipi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Günlük</SelectItem>
              <SelectItem value="weekly">Haftalık</SelectItem>
              <SelectItem value="monthly">Aylık</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex rounded-lg border">
            <Button
              variant={view === 'day' ? 'default' : 'ghost'}
              className="rounded-none rounded-l-lg"
              onClick={() => handleViewChange('day')}
            >
              Gün
            </Button>
            <Button
              variant={view === 'week' ? 'default' : 'ghost'}
              className="rounded-none border-l"
              onClick={() => handleViewChange('week')}
            >
              Hafta
            </Button>
            <Button
              variant={view === 'month' ? 'default' : 'ghost'}
              className="rounded-none rounded-r-lg border-l"
              onClick={() => handleViewChange('month')}
            >
              Ay
            </Button>
          </div>
        </div>
      </div>

      {view === 'week' && (
        <div className="flex-1 overflow-hidden">
          <div className="grid grid-cols-8 border-b">
            <div className="p-2 border-r" /> {/* Time column header */}
            {weekDays.map((date, index) => (
              <div
                key={index}
                className={cn(
                  "p-2 text-center border-r",
                  isSameDay(date, new Date()) && "bg-primary/5"
                )}
              >
                <div className="font-medium">{format(date, 'EEEE')}</div>
                <div className="text-sm text-muted-foreground">
                  {format(date, 'd MMM')}
                </div>
              </div>
            ))}
          </div>
          <ScrollArea className="flex-1">
            <div className="relative">
              {timeSlots.map((hour) => (
                <div key={hour} className="grid grid-cols-8 border-b">
                  <div className="p-2 text-right text-sm text-muted-foreground border-r">
                    {`${hour.toString().padStart(2, '0')}:00`}
                  </div>
                  {weekDays.map((date, dayIndex) => {
                    const events = getEventsForDay(addDays(date, dayIndex));
                    return (
                      <div
                        key={dayIndex}
                        className={cn(
                          "p-2 border-r min-h-[60px]",
                          isSameDay(date, new Date()) && "bg-primary/5"
                        )}
                      >
                        {events.map((event, eventIndex) => (
                          <div
                            key={eventIndex}
                            className={cn(
                              "text-xs p-1 mb-1 rounded cursor-pointer",
                              event.color || "bg-primary/20"
                            )}
                            onClick={() => onEventClick?.(event)}
                          >
                            {event.title}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {view === 'month' && (
        <div className="p-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && handleDateChange(date)}
            className="rounded-md border"
          />
        </div>
      )}

      {view === 'day' && (
        <div className="flex-1 overflow-hidden">
          <div className="grid grid-cols-2 border-b">
            <div className="p-2 border-r text-center">
              <div className="font-medium">
                {format(selectedDate, 'EEEE')}
              </div>
              <div className="text-sm text-muted-foreground">
                {format(selectedDate, 'd MMM')}
              </div>
            </div>
            <div className="p-2" />
          </div>
          <ScrollArea className="flex-1">
            <div className="relative">
              {timeSlots.map((hour) => {
                const events = getEventsForDay(selectedDate);
                return (
                  <div key={hour} className="grid grid-cols-2 border-b">
                    <div className="p-2 text-right text-sm text-muted-foreground border-r">
                      {`${hour.toString().padStart(2, '0')}:00`}
                    </div>
                    <div className="p-2 min-h-[60px]">
                      {events.map((event, eventIndex) => (
                        <div
                          key={eventIndex}
                          className={cn(
                            "text-xs p-1 mb-1 rounded cursor-pointer",
                            event.color || "bg-primary/20"
                          )}
                          onClick={() => onEventClick?.(event)}
                        >
                          {event.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}