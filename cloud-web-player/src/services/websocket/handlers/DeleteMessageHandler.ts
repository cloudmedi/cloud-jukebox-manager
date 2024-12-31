import { toast } from "sonner";

export const handleDeleteMessage = (message: any) => {
  if (message.action === 'started') {
    toast.loading('Silme işlemi başlatıldı...');
  } else if (message.action === 'success') {
    toast.success('Silme işlemi başarılı');
  } else if (message.action === 'error') {
    toast.error(`Silme işlemi başarısız: ${message.error}`);
  }
};