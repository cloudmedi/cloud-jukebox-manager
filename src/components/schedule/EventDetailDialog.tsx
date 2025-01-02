import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";

interface EventDetailDialogProps {
  event: any;
  isOpen: boolean;
  onClose: () => void;
}

export function EventDetailDialog({ event, isOpen, onClose }: EventDetailDialogProps) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`http://localhost:5000/api/playlist-schedules/${event.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Zamanlama silinemedi");
      }
    },
    onSuccess: () => {
      toast.success("Zamanlama başarıyla silindi");
      queryClient.invalidateQueries({ queryKey: ["playlist-schedules"] });
      onClose();
    },
    onError: (error: Error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  const handleDelete = () => {
    if (window.confirm("Bu zamanlamayı silmek istediğinizden emin misiniz?")) {
      deleteMutation.mutate();
    }
  };

  if (!event) return null;

  return (
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
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {deleteMutation.isPending ? "Siliniyor..." : "Sil"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}