import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

interface EventDetailDialogProps {
  event: any;
  isOpen: boolean;
  onClose: () => void;
}

export function EventDetailDialog({ event, isOpen, onClose }: EventDetailDialogProps) {
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      console.log("Silme işlemi başlatıldı. Event ID:", event.extendedProps.originalEventId);
      
      const response = await fetch(`http://localhost:5000/api/playlist-schedules/${event.extendedProps.originalEventId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Silme hatası:", errorData);
        throw new Error(errorData.message || "Zamanlama silinemedi");
      }

      const data = await response.json();
      console.log("Silme yanıtı:", data);
      return data;
    },
    onSuccess: () => {
      console.log("Silme başarılı, cache güncelleniyor");
      toast.success("Zamanlama başarıyla silindi");
      queryClient.invalidateQueries({ queryKey: ["playlist-schedules"] });
      onClose();
      setShowDeleteAlert(false);
    },
    onError: (error: Error) => {
      console.error("Silme hatası:", error);
      toast.error(`Hata: ${error.message}`);
      setShowDeleteAlert(false);
    },
  });

  const handleDelete = () => {
    console.log("Silme işlemi onaylandı");
    deleteMutation.mutate();
  };

  if (!event) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Zamanlama Detayları</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Playlist</h3>
              <p>{event.title}</p>
            </div>
            <div>
              <h3 className="font-semibold">Başlangıç</h3>
              <p>{format(new Date(event.start), "d MMMM yyyy HH:mm", { locale: tr })}</p>
            </div>
            <div>
              <h3 className="font-semibold">Bitiş</h3>
              <p>{format(new Date(event.end), "d MMMM yyyy HH:mm", { locale: tr })}</p>
            </div>
            <div>
              <h3 className="font-semibold">Hedef</h3>
              <p>{event.extendedProps.targetType === 'device' ? 'Cihaz' : 'Grup'}</p>
            </div>
            <div className="flex justify-end pt-4">
              <Button 
                variant="destructive" 
                onClick={() => setShowDeleteAlert(true)}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {deleteMutation.isPending ? "Siliniyor..." : "Sil"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bu zamanlamayı silmek istediğinizden emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Bu zamanlama kalıcı olarak silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}