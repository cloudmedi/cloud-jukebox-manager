import { toast } from "sonner";

export const handleDeviceDelete = (message: any) => {
  if (message.success) {
    toast.success('Cihaz başarıyla silindi');
  } else {
    toast.error('Cihaz silinirken bir hata oluştu');
  }
};