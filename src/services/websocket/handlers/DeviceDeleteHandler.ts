import { toast } from "sonner";

export const handleDeviceDelete = (message: any) => {
  if (message.type === 'delete' && message.entityType === 'device') {
    toast.success(`Cihaz başarıyla silindi: ${message.deviceName || message.deviceId}`);
  }
};