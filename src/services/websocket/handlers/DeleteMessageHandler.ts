import { toast } from "sonner";

export const handleDeleteMessage = (message: any) => {
  switch (message.action) {
    case 'started':
      toast.info(`${message.entityType} silme işlemi başladı...`);
      break;
    case 'success':
      toast.success(`${message.entityType} başarıyla silindi`);
      break;
    case 'error':
      toast.error(`Silme işlemi başarısız: ${message.error}`);
      break;
    default:
      console.warn('Unknown delete action:', message.action);
  }
};