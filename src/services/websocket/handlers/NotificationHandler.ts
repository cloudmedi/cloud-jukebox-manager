import { toast } from "sonner";
import { queryClient } from "@/lib/react-query";

export const handleNotificationMessage = (message: any) => {
  // Yeni bildirim geldiğinde
  if (message.type === 'newNotification') {
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