import { Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface Notification {
  id: string;
  type: 'playlist' | 'device' | 'announcement' | 'system' | 'user';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export function NotificationsPopover() {
  const { toast } = useToast();

  const { data: notifications = [], isLoading, error } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      try {
        const response = await fetch('http://localhost:5000/api/notifications');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching notifications:', error);
        throw new Error('Bildirimler yüklenemedi. Lütfen daha sonra tekrar deneyin.');
      }
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    meta: {
      onError: (error: Error) => {
        toast({
          title: "Hata",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  });

  const unreadCount = notifications.filter((n: Notification) => !n.read).length;

  const markAllAsRead = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/notifications/mark-all-read', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Bildirimler okundu olarak işaretlenemedi');
      }

      toast({
        title: "Başarılı",
        description: "Tüm bildirimler okundu olarak işaretlendi",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Bildirimler işaretlenirken bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'playlist':
        return '🎵';
      case 'device':
        return '📱';
      case 'announcement':
        return '📢';
      case 'system':
        return '⚙️';
      case 'user':
        return '👤';
      default:
        return '📌';
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-semibold">Bildirimler</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Tümünü okundu işaretle
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
          ) : error ? (
            <p className="text-center text-muted-foreground py-4">
              Bildirimler yüklenirken bir hata oluştu
            </p>
          ) : notifications.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              Bildirim bulunmuyor
            </p>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification: Notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg ${
                    notification.read ? 'bg-background' : 'bg-muted'
                  }`}
                >
                  <div className="flex gap-2">
                    <span>{getNotificationIcon(notification.type)}</span>
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {notification.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(notification.createdAt).toLocaleString('tr-TR')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}