import { Calendar, Views } from 'react-big-calendar';
import { momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/tr';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useToast } from "@/hooks/use-toast";
import { useCallback, useState, useEffect, useRef } from "react";
import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import 'moment-timezone';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Copy, MoveRight, Save, Download, Trash2 } from "lucide-react";
import { TimelineFilters, TimelineFilters as TimelineFiltersType } from "./TimelineFilters";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Tip tanımlamaları
interface RecurrenceRule {
  type: 'daily' | 'weekly' | 'monthly';
  interval: number;
  endDate: string;
  daysOfWeek?: number[];
}

interface PlaylistSchedule {
  _id: string;
  startDate: string;
  endDate: string;
  playlist: {
    _id: string;
    name: string;
  };
  isRecurring?: boolean;
  recurrence?: RecurrenceRule;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  playlist: {
    _id: string;
    name: string;
  };
  resource: {
    backgroundColor: string;
    borderColor: string;
    color: string;
    playlistId: string;
  };
  isRecurring?: boolean;
  recurrence?: RecurrenceRule;
  isRecurrenceInstance?: boolean;
  originalEventId?: string;
}

interface CalendarViewProps {
  onDateSelect: (selectInfo: any) => void;
  onEventClick: (clickInfo: any) => void;
  view: string;
  refreshTrigger?: number;
  onEventChange?: (event: CalendarEvent) => void;
  onEventDelete?: (eventId: string) => void;
}

// Moment.js'i Türkçe ve timezone ayarları
moment.locale('tr');

// Moment localizer'ı oluştur
const localizer = momentLocalizer(moment);

// Performans için memoize edilmiş takvim komponenti
const MemoizedCalendar = memo(withDragAndDrop(Calendar));

function ScheduleActions({ onCopyToNextWeek, onMoveSchedule, onSaveTemplate, onLoadTemplate, onBulkDelete }) {
  const [moveOffset, setMoveOffset] = useState(1);
  const [templateName, setTemplateName] = useState("");

  return (
    <div className="flex items-center gap-2 mb-4">
      <Button
        variant="outline"
        size="sm"
        onClick={onCopyToNextWeek}
        className="flex items-center gap-2"
      >
        <Copy className="w-4 h-4" />
        Gelecek Haftaya Kopyala
      </Button>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <MoveRight className="w-4 h-4" />
            Programı Kaydır
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-60">
          <div className="space-y-2">
            <Label htmlFor="moveOffset">Kaç gün kaydırılsın?</Label>
            <div className="flex items-center gap-2">
              <Input
                id="moveOffset"
                type="number"
                value={moveOffset}
                onChange={(e) => setMoveOffset(parseInt(e.target.value))}
                min={1}
                className="w-20"
              />
              <Button size="sm" onClick={() => onMoveSchedule(moveOffset)}>
                Uygula
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Save className="w-4 h-4" />
            Şablon Kaydet
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-60">
          <div className="space-y-2">
            <Label htmlFor="templateName">Şablon Adı</Label>
            <div className="flex items-center gap-2">
              <Input
                id="templateName"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Örn: Hafta içi programı"
              />
              <Button size="sm" onClick={() => onSaveTemplate(templateName)}>
                Kaydet
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Button
        variant="outline"
        size="sm"
        onClick={onLoadTemplate}
        className="flex items-center gap-2"
      >
        <Download className="w-4 h-4" />
        Şablon Yükle
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={onBulkDelete}
        className="flex items-center gap-2"
      >
        <Trash2 className="w-4 h-4" />
        Toplu Sil
      </Button>
    </div>
  );
}

export function CalendarView({ 
  onDateSelect, 
  onEventClick, 
  view, 
  refreshTrigger = 0,
  onEventChange,
  onEventDelete 
}: CalendarViewProps) {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(moment().startOf('week').toDate());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const eventsRef = useRef<CalendarEvent[]>([]);
  const [currentView, setCurrentView] = useState(Views.WEEK);
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    eventToDelete: null
  });
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState({
    isOpen: false,
    startDate: null,
    endDate: null
  });

  // Filtreleri uygula
  const handleFiltersChange = useCallback((filters: TimelineFiltersType) => {
    let filtered = [...events];

    // İsme göre filtrele
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(searchLower)
      );
    }

    // Tarih aralığına göre filtrele
    if (filters.dateRange.from || filters.dateRange.to) {
      filtered = filtered.filter(event => {
        const eventStart = moment(event.start);
        const eventEnd = moment(event.end);
        
        if (filters.dateRange.from && eventEnd.isBefore(filters.dateRange.from)) {
          return false;
        }
        
        if (filters.dateRange.to && eventStart.isAfter(filters.dateRange.to)) {
          return false;
        }
        
        return true;
      });
    }

    // Playlist'e göre filtrele
    if (filters.selectedPlaylists.length > 0) {
      filtered = filtered.filter(event =>
        filters.selectedPlaylists.includes(event.playlist._id)
      );
    }

    // Tekrarlanan event'leri filtrele
    if (!filters.showRecurring) {
      filtered = filtered.filter(event => !event.isRecurring && !event.isRecurrenceInstance);
    }

    setFilteredEvents(filtered);
  }, [events]);

  // Events state'ini ref'te tut
  useEffect(() => {
    eventsRef.current = events;
    handleFiltersChange({
      search: "",
      dateRange: { from: undefined, to: undefined },
      selectedPlaylists: [],
      showRecurring: true
    });
  }, [events, handleFiltersChange]);

  // Event stilleri için yardımcı fonksiyon
  const getEventColor = useCallback((playlistId: string) => {
    // Playlist ID'sine göre sabit bir renk üret
    const hue = Math.abs(playlistId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 360;
    return {
      backgroundColor: `hsla(${hue}, 70%, 85%, 0.7)`,
      borderColor: `hsl(${hue}, 70%, 70%)`,
      color: `hsl(${hue}, 70%, 25%)`,
      playlistId
    };
  }, []);

  // Event stilleri
  const eventPropGetter = useCallback((event: CalendarEvent) => {
    return {
      style: {
        backgroundColor: event.resource.backgroundColor,
        borderColor: event.resource.borderColor,
        color: event.resource.color,
        borderWidth: '2px',
        borderStyle: event.isRecurring || event.isRecurrenceInstance ? 'dashed' : 'solid',
        opacity: isDragging ? 0.5 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
        transition: 'all 0.2s ease',
        ...(isDragging && {
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          transform: 'scale(1.02)'
        })
      }
    };
  }, [isDragging]);

  // Tekrarlanan event'leri oluştur
  const generateRecurringEvents = useCallback((baseEvent: CalendarEvent, recurrence: RecurrenceRule): CalendarEvent[] => {
    const events: CalendarEvent[] = [];
    const startDate = moment(baseEvent.start);
    const endDate = moment(baseEvent.end);
    const duration = moment.duration(endDate.diff(startDate));
    const recurrenceEnd = moment(recurrence.endDate);

    let currentStart = startDate.clone();
    
    while (currentStart.isSameOrBefore(recurrenceEnd)) {
      // Haftalık tekrarda belirli günler için kontrol
      if (recurrence.type === 'weekly' && recurrence.daysOfWeek?.length) {
        const currentDay = currentStart.day();
        if (!recurrence.daysOfWeek.includes(currentDay)) {
          currentStart.add(1, 'day');
          continue;
        }
      }

      const currentEnd = currentStart.clone().add(duration);
      
      // Eğer bitiş tarihini geçtiyse döngüyü bitir
      if (currentEnd.isAfter(recurrenceEnd)) break;

      events.push({
        ...baseEvent,
        id: `${baseEvent.id}_${currentStart.format('YYYY-MM-DD')}`,
        start: currentStart.toDate(),
        end: currentEnd.toDate(),
        isRecurrenceInstance: true,
        originalEventId: baseEvent.id
      });

      // Tekrarlama tipine göre ilerleme
      switch (recurrence.type) {
        case 'daily':
          currentStart.add(recurrence.interval, 'days');
          break;
        case 'weekly':
          if (recurrence.daysOfWeek?.length) {
            currentStart.add(1, 'day');
          } else {
            currentStart.add(recurrence.interval, 'weeks');
          }
          break;
        case 'monthly':
          currentStart.add(recurrence.interval, 'months');
          break;
      }
    }

    return events;
  }, []);

  // Event'leri getir
  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("http://localhost:5000/api/playlist-schedules");
      if (!response.ok) throw new Error("Zamanlamalar yüklenemedi");
      const data: PlaylistSchedule[] = await response.json();
      
      const allEvents: CalendarEvent[] = [];
      
      // Event'leri dönüştür
      data.forEach((schedule) => {
        const colors = getEventColor(schedule.playlist._id);
        
        const baseEvent: CalendarEvent = {
          id: schedule._id,
          title: schedule.playlist.name,
          start: new Date(schedule.startDate),
          end: new Date(schedule.endDate),
          playlist: schedule.playlist,
          resource: colors,
          isRecurring: schedule.isRecurring,
          recurrence: schedule.recurrence
        };

        allEvents.push(baseEvent);

        // Tekrarlanan event'leri oluştur
        if (schedule.isRecurring && schedule.recurrence) {
          const recurringEvents = generateRecurringEvents(baseEvent, schedule.recurrence);
          allEvents.push(...recurringEvents);
        }
      });

      setEvents(allEvents);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Event'ler yüklenemedi",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, generateRecurringEvents, getEventColor]);

  // Event'leri yükle
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents, refreshTrigger]);

  // Event'lerin çakışıp çakışmadığını kontrol et
  const checkEventOverlap = useCallback((targetStart: Date, targetEnd: Date, eventId?: string) => {
    const currentEvents = eventsRef.current;
    
    // Tekrarlanan event instance'larını filtrele
    const relevantEvents = currentEvents.filter(event => !event.isRecurrenceInstance);
    
    const samePlaylistEvents = relevantEvents.filter(event => {
      if (eventId && event.id === eventId) return false;
      const targetEvent = relevantEvents.find(e => e.id === eventId);
      return targetEvent ? event.resource.playlistId === targetEvent.resource.playlistId : true;
    });

    return samePlaylistEvents.some(event => {
      const eventStart = moment(event.start);
      const eventEnd = moment(event.end);
      const newStart = moment(targetStart);
      const newEnd = moment(targetEnd);

      return (
        (newStart.isSameOrAfter(eventStart) && newStart.isBefore(eventEnd)) ||
        (newEnd.isAfter(eventStart) && newEnd.isSameOrBefore(eventEnd)) ||
        (newStart.isSameOrBefore(eventStart) && newEnd.isSameOrAfter(eventEnd))
      );
    });
  }, []);

  // Event state'i için optimistik güncelleme yardımcı fonksiyonu
  const updateEventState = useCallback((updatedEvent: CalendarEvent) => {
    setEvents(prevEvents => 
      prevEvents.map(e => e.id === updatedEvent.id ? updatedEvent : e)
    );
  }, []);

  // Event güncelleme
  const updateEvent = async (id: string, start: Date, end: Date, isRecurrenceInstance?: boolean) => {
    try {
      // Ana event ID'sini al
      const originalId = isRecurrenceInstance ? id.split('_')[0] : id;

      if (checkEventOverlap(start, end, originalId)) {
        toast({
          title: "Hata",
          description: "Bu playlist için seçilen zaman aralığında başka bir zamanlama mevcut",
          variant: "destructive",
        });
        return false;
      }

      const response = await fetch(`http://localhost:5000/api/playlist-schedules/${originalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        }),
      });

      if (!response.ok) throw new Error("Güncelleme başarısız");

      // Event'i lokalde güncelle
      const updatedEvents = eventsRef.current.map(event => {
        if (isRecurrenceInstance) {
          // Tekrarlanan event instance'ı ise sadece o instance'ı güncelle
          if (event.id === id) {
            const updatedEvent = {
              ...event,
              start,
              end
            };
            onEventChange?.(updatedEvent);
            return updatedEvent;
          }
        } else {
          // Ana event ise tüm tekrarları güncelle
          if (event.id === id || event.originalEventId === id) {
            const timeDiff = moment(end).diff(moment(start));
            const eventStart = moment(event.start);
            const updatedEvent = {
              ...event,
              start: eventStart.toDate(),
              end: eventStart.clone().add(timeDiff).toDate()
            };
            onEventChange?.(updatedEvent);
            return updatedEvent;
          }
        }
        return event;
      });

      setEvents(updatedEvents);
      return true;
    } catch (error) {
      toast({
        title: "Hata",
        description: "Güncelleme başarısız oldu",
        variant: "destructive",
      });
      return false;
    }
  };

  // Event taşıma
  const moveEvent = useCallback(
    async ({ event, start, end }: { event: any; start: Date; end: Date }) => {
      console.log('moveEvent çağrıldı:', { event, start, end });
      try {
        setIsDragging(true);

        // Minimum süre kontrolü
        const duration = moment.duration(moment(end).diff(moment(start))).asMinutes();
        if (duration < 30) {
          end = moment(start).add(30, 'minutes').toDate();
        }

        // Optimistik güncelleme
        const updatedEvent = {
          ...event,
          start,
          end
        };
        updateEventState(updatedEvent);

        // Çakışma kontrolü
        if (checkEventOverlap(start, end, event.id)) {
          toast({
            title: "Hata",
            description: "Bu zaman aralığında başka bir event var",
            variant: "destructive",
          });
          // Hata durumunda orijinal state'e dön
          setEvents(eventsRef.current);
          return;
        }

        // Backend güncelleme
        const response = await fetch(`http://localhost:5000/api/playlist-schedules/${event.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            startDate: start.toISOString(),
            endDate: end.toISOString(),
          }),
        });

        if (!response.ok) {
          throw new Error('Event güncellenemedi');
        }

        // Parent'a bildir
        onEventChange?.(updatedEvent);

      } catch (error) {
        console.error('Event taşıma hatası:', error);
        toast({
          title: "Hata",
          description: "Event taşıma başarısız oldu",
          variant: "destructive",
        });
        // Hata durumunda orijinal state'e dön
        setEvents(eventsRef.current);
      } finally {
        setIsDragging(false);
      }
    },
    [checkEventOverlap, onEventChange, toast, updateEventState]
  );

  // Event yeniden boyutlandırma
  const onEventResize = useCallback(
    async ({ event, start, end }: { event: any; start: Date; end: Date }) => {
      console.log('onEventResize çağrıldı:', { event, start, end });
      try {
        setIsDragging(true);

        // Minimum süre kontrolü
        const duration = moment.duration(moment(end).diff(moment(start))).asMinutes();
        if (duration < 30) {
          end = moment(start).add(30, 'minutes').toDate();
        }

        // Optimistik güncelleme
        const updatedEvent = {
          ...event,
          start,
          end
        };
        updateEventState(updatedEvent);

        // Çakışma kontrolü
        if (checkEventOverlap(start, end, event.id)) {
          toast({
            title: "Hata",
            description: "Bu zaman aralığında başka bir event var",
            variant: "destructive",
          });
          setEvents(eventsRef.current);
          return;
        }

        // Backend güncelleme
        const response = await fetch(`http://localhost:5000/api/playlist-schedules/${event.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            startDate: start.toISOString(),
            endDate: end.toISOString(),
          }),
        });

        if (!response.ok) {
          throw new Error('Event güncellenemedi');
        }

        // Parent'a bildir
        onEventChange?.(updatedEvent);

      } catch (error) {
        console.error('Event yeniden boyutlandırma hatası:', error);
        toast({
          title: "Hata",
          description: "Event yeniden boyutlandırma başarısız oldu",
          variant: "destructive",
        });
        setEvents(eventsRef.current);
      } finally {
        setIsDragging(false);
      }
    },
    [checkEventOverlap, onEventChange, toast, updateEventState]
  );

  // Event silme
  const handleEventDelete = async (eventToDelete) => {
    try {
      // Sadece seçilen event'i sil
      const updatedEvents = events.filter(event => event.id !== eventToDelete.id);
      setEvents(updatedEvents);

      // API'ye silme isteği gönder
      const response = await fetch(`http://localhost:5000/api/playlist-schedules/${eventToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Event silinemedi');
      }

      setDeleteDialog({ isOpen: false, eventToDelete: null });
      
    } catch (error) {
      console.error('Event silme hatası:', error);
      // Hata durumunda orijinal state'e dön
      toast({
        title: "Hata",
        description: "Event silme başarısız oldu",
        variant: "destructive",
      });
    }
  };

  // Event silme handler'ını handleEventClick'e bağla
  const handleEventClick = (event) => {
    setDeleteDialog({
      isOpen: true,
      eventToDelete: event
    });
  };

  // Yeni event oluşturma
  const handleSelectSlot = useCallback(
    ({ start, end }: { start: Date; end: Date }) => {
      onDateSelect({
        start,
        end,
        getEventColor
      });
    },
    [onDateSelect, getEventColor]
  );

  // Tarih navigasyonu
  const handleNavigate = useCallback((newDate: Date, view?: string, action?: string) => {
    if (action === 'TODAY') {
      setCurrentDate(moment().startOf('week').toDate());
    } else {
      setCurrentDate(newDate);
    }
  }, []);

  // Görünüm değişimi
  const handleViewChange = useCallback((newView: string) => {
    setCurrentView(newView);
  }, []);

  const handleCopyToNextWeek = () => {
    // Mevcut eventleri bir hafta sonrasına kopyala
    const newEvents = events.map(event => ({
      ...event,
      start: new Date(event.start.getTime() + 7 * 24 * 60 * 60 * 1000),
      end: new Date(event.end.getTime() + 7 * 24 * 60 * 60 * 1000)
    }));

    // Çakışan eventleri filtrele
    const filteredNewEvents = newEvents.filter(newEvent => {
      // Bu yeni event'in saatinde başka event var mı kontrol et
      return !events.some(existingEvent => 
        moment(existingEvent.start).format('YYYY-MM-DD HH:mm') === moment(newEvent.start).format('YYYY-MM-DD HH:mm') &&
        moment(existingEvent.end).format('YYYY-MM-DD HH:mm') === moment(newEvent.end).format('YYYY-MM-DD HH:mm')
      );
    });

    setEvents([...events, ...filteredNewEvents]);
  };

  const handleMoveSchedule = (days: number) => {
    const offset = days * 24 * 60 * 60 * 1000;
    const movedEvents = events.map(event => ({
      ...event,
      start: new Date(event.start.getTime() + offset),
      end: new Date(event.end.getTime() + offset)
    }));
    setEvents(movedEvents);
  };

  const handleSaveTemplate = (name: string) => {
    const template = {
      name,
      events: events.map(({ start, end, playlist }) => ({
        start: moment(start).format('HH:mm'),
        end: moment(end).format('HH:mm'),
        playlistId: playlist._id
      }))
    };
    // Template'i localStorage'a kaydet
    const templates = JSON.parse(localStorage.getItem('scheduleTemplates') || '[]');
    localStorage.setItem('scheduleTemplates', JSON.stringify([...templates, template]));
  };

  const handleLoadTemplate = () => {
    // Template listesini göster ve seçilen template'i yükle
    const templates = JSON.parse(localStorage.getItem('scheduleTemplates') || '[]');
    // TODO: Template seçim modalı ekle
  };

  const handleBulkDelete = async () => {
    try {
      if (!bulkDeleteDialog.startDate || !bulkDeleteDialog.endDate) {
        toast({
          title: "Hata",
          description: "Lütfen tarih aralığı seçin",
          variant: "destructive",
        });
        return;
      }

      // Seçili tarih aralığındaki eventleri filtrele
      const eventsToDelete = events.filter(event => {
        const eventDate = moment(event.start);
        return eventDate.isBetween(
          moment(bulkDeleteDialog.startDate).startOf('day'),
          moment(bulkDeleteDialog.endDate).endOf('day'),
          'day',
          '[]'
        );
      });

      // UI'dan eventleri kaldır
      const updatedEvents = events.filter(event => !eventsToDelete.includes(event));
      setEvents(updatedEvents);

      // Her bir event için ayrı silme isteği gönder
      for (const event of eventsToDelete) {
        await fetch(`http://localhost:5000/api/playlist-schedules/${event.id}`, {
          method: 'DELETE',
        });
      }

      // Dialog'u kapat
      setBulkDeleteDialog({ isOpen: false, startDate: null, endDate: null });

      toast({
        title: "Başarılı",
        description: `${eventsToDelete.length} event başarıyla silindi`,
      });

    } catch (error) {
      console.error('Toplu silme hatası:', error);
      toast({
        title: "Hata",
        description: "Eventler silinirken bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="bg-background rounded-lg border p-4">
      {/* Silme Dialog'u */}
      <Dialog open={deleteDialog.isOpen} onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eventi Sil</DialogTitle>
            <DialogDescription>
              {deleteDialog.eventToDelete && (
                <>
                  <p className="mb-2">
                    <strong>{deleteDialog.eventToDelete.playlist.name}</strong> çalma listesini{' '}
                    <strong>{moment(deleteDialog.eventToDelete.start).format('HH:mm')} - {moment(deleteDialog.eventToDelete.end).format('HH:mm')}</strong>{' '}
                    saatleri arasından silmek istediğinize emin misiniz?
                  </p>
                  <p className="text-muted-foreground">
                    Bu işlem seçili eventi silecektir.
                  </p>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ isOpen: false, eventToDelete: null })}
            >
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteDialog.eventToDelete && handleEventDelete(deleteDialog.eventToDelete)}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toplu Silme Dialog'u */}
      <Dialog 
        open={bulkDeleteDialog.isOpen} 
        onOpenChange={(open) => setBulkDeleteDialog(prev => ({ ...prev, isOpen: open }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Toplu Event Silme</DialogTitle>
            <DialogDescription>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Başlangıç Tarihi</Label>
                    <Input
                      type="date"
                      value={bulkDeleteDialog.startDate || ''}
                      onChange={(e) => setBulkDeleteDialog(prev => ({
                        ...prev,
                        startDate: e.target.value
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bitiş Tarihi</Label>
                    <Input
                      type="date"
                      value={bulkDeleteDialog.endDate || ''}
                      onChange={(e) => setBulkDeleteDialog(prev => ({
                        ...prev,
                        endDate: e.target.value
                      }))}
                    />
                  </div>
                </div>
                <p className="text-muted-foreground text-sm">
                  Seçilen tarih aralığındaki tüm eventler silinecektir. Bu işlem geri alınamaz.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkDeleteDialog({ isOpen: false, startDate: null, endDate: null })}
            >
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Toplu Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ScheduleActions
        onCopyToNextWeek={handleCopyToNextWeek}
        onMoveSchedule={handleMoveSchedule}
        onSaveTemplate={handleSaveTemplate}
        onLoadTemplate={handleLoadTemplate}
        onBulkDelete={() => setBulkDeleteDialog({ isOpen: true, startDate: null, endDate: null })}
      />
      <AnimatePresence mode="wait">
        <motion.div
          key={currentView + currentDate.toISOString()}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {currentView === 'agenda' && (
            <TimelineFilters
              playlists={Array.from(new Set(events.map(e => e.playlist))).map(p => ({ 
                _id: p._id, 
                name: p.name,
                backgroundColor: getEventColor(p._id).backgroundColor,
                borderColor: getEventColor(p._id).borderColor,
                color: getEventColor(p._id).color
              }))}
              onFiltersChange={handleFiltersChange}
            />
          )}
          <MemoizedCalendar
            localizer={localizer}
            events={currentView === 'agenda' ? filteredEvents : events}
            defaultView={Views.WEEK}
            views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
            step={30}
            timeslots={2}
            selectable={true}
            resizable
            date={currentDate}
            view={currentView}
            onView={handleViewChange}
            onNavigate={handleNavigate}
            draggableAccessor={() => true}
            onEventDrop={(dropInfo) => {
              console.log('onEventDrop tetiklendi:', dropInfo);
              const { event, start, end } = dropInfo;
              moveEvent({ event, start, end });
            }}
            onEventResize={(resizeInfo) => {
              console.log('onEventResize tetiklendi:', resizeInfo);
              const { event, start, end } = resizeInfo;
              onEventResize({ event, start, end });
            }}
            onSelectEvent={handleEventClick}
            onSelectSlot={handleSelectSlot}
            eventPropGetter={eventPropGetter}
            formats={{
              timeGutterFormat: (date: Date) => moment(date).format('HH:mm'),
              eventTimeRangeFormat: ({ start, end }: { start: Date, end: Date }) => {
                return `${moment(start).format('HH:mm')} - ${moment(end).format('HH:mm')}`;
              },
              dayFormat: (date: Date) => moment(date).format('DD'),
              dayHeaderFormat: (date: Date) => moment(date).format('DD MMMM YYYY'),
              dayRangeHeaderFormat: ({ start, end }: { start: Date, end: Date }) => {
                const startStr = moment(start).format('DD MMMM');
                const endStr = moment(end).format('DD MMMM YYYY');
                return `${startStr} - ${endStr}`;
              },
              agendaTimeFormat: (date: Date) => moment(date).format('HH:mm'),
              agendaTimeRangeFormat: ({ start, end }: { start: Date, end: Date }) => {
                return `${moment(start).format('HH:mm')} - ${moment(end).format('HH:mm')}`;
              }
            }}
            style={{ height: 'calc(100vh - 100px)' }}
            min={moment().startOf('day').toDate()} 
            max={moment().endOf('day').toDate()} 
            scrollToTime={moment().startOf('day').toDate()} 
            messages={{
              today: 'Bugün',
              previous: 'Önceki',
              next: 'Sonraki',
              month: 'Ay',
              week: 'Hafta',
              day: 'Gün',
              agenda: 'Zaman Akışı',
              date: 'Tarih',
              time: 'Saat',
              event: 'Çalma Listesi',
              allDay: 'Tüm gün',
              showMore: (total: number) => `+${total} daha fazla`
            }}
            components={{
              toolbar: CustomToolbar
            }}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Özel Toolbar Komponenti
const CustomToolbar = memo(({ 
  date, 
  view, 
  views, 
  label, 
  onNavigate, 
  onView 
}: any) => {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate('TODAY')}
        >
          Bugün
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate('PREV')}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate('NEXT')}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <span className="text-lg font-semibold ml-4">
          {label}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {views.map((name: string) => (
          <Button
            key={name}
            variant={view === name ? "default" : "outline"}
            size="sm"
            onClick={() => onView(name)}
          >
            {name === 'month' && 'Ay'}
            {name === 'week' && 'Hafta'}
            {name === 'day' && 'Gün'}
            {name === 'agenda' && 'Zaman Akışı'}
          </Button>
        ))}
      </div>
    </div>
  );
});