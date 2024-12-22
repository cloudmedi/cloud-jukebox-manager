import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Bell } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export function NotificationsPopover() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      title: "Yeni Playlist",
      message: "Yaz Hit 2024 playlistine 5 yeni şarkı eklendi",
      time: "5 dakika önce",
      read: false,
    },
    {
      id: "2",
      title: "Cihaz Durumu",
      message: "Mağaza-1 cihazı çevrimdışı oldu",
      time: "1 saat önce",
      read: false,
    },
    {
      id: "3",
      title: "Sistem Bildirimi",
      message: "Sistem güncellemesi başarıyla tamamlandı",
      time: "2 saat önce",
      read: true,
    },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-semibold">Bildirimler</h4>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))}
            >
              Tümünü okundu işaretle
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  notification.read ? 'bg-background' : 'bg-muted/50'
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex justify-between items-start mb-1">
                  <h5 className="font-medium text-sm">{notification.title}</h5>
                  <span className="text-xs text-muted-foreground">
                    {notification.time}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {notification.message}
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}