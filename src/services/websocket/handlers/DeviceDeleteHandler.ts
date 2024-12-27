import { toast } from "sonner";

export const handleDeviceDelete = (message: any) => {
  if (message.action === 'started') {
    toast.loading(`${message.deviceName || 'Cihaz'} siliniyor...`);
  } 
  else if (message.action === 'success') {
    toast.success(`${message.deviceName || 'Cihaz'} başarıyla silindi`);
  }
  else if (message.action === 'error') {
    toast.error(`Silme işlemi başarısız: ${message.error}`);
  }
};