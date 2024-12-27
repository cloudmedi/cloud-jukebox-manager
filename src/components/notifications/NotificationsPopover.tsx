import { Bell } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useEffect } from "react";
import websocketService from "@/services/websocketService";

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
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await fetch('http://localhost:5000/api/notifications');
      if (!response.ok) {
        throw new Error('Bildirimler yüklenemedi');
      }
      return response.json();
    },
  });

  // WebSocket bağlantısını dinle
  useEffect(() => {
    const handleNotification = (message: any) => {
      if (message.type === 'newNotification') {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        toast({
          title: message.notification.title,
          description: message.notification.message,
        });
      }
    };

    websocketService.addMessageHandler('notification', handleNotification);

    return () => {
      websocketService.removeMessageHandler('notification', handleNotification);
    };
  }, [queryClient, toast]);

  const unreadCount = notifications.filter((n: Notification) => !n.read).length;

  const markAllAsRead = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/notifications/mark-all-read', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Bildirimler okundu olarak işaretlenemedi');
      }

      // WebSocket üzerinden bildirim gönder
      websocketService.sendMessage({
        type: 'notification',
        action: 'markAllRead'
      });

      queryClient.invalidateQueries({ queryKey: ['notifications'] });

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