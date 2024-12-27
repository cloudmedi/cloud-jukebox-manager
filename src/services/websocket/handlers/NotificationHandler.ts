import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface NotificationMessage {
  type: 'newNotification' | 'notificationRead';
  notification?: {
    title: string;
    message: string;
  };
}

export const handleNotificationMessage = (message: NotificationMessage) => {
  const queryClient = useQueryClient();

  // Yeni bildirim geldiğinde
  if (message.type === 'newNotification' && message.notification) {
    // Cache'i güncelle
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    
    // Kullanıcıya bildirim göster
    toast({
      title: message.notification.title,
      description: message.notification.message,
    });
  }
  
  // Bildirim okundu durumu güncellendiğinde
  if (message.type === 'notificationRead') {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  }
};