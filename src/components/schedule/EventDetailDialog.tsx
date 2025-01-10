import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { toast } from "sonner";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Trash2, Edit, Calendar, Users, Repeat } from "lucide-react";
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
import { useState, useEffect } from "react";
import { PlaylistScheduleForm } from "./PlaylistScheduleForm";
import { Button } from "@/components/ui/button";

interface EventDetailDialogProps {
  event: any;
  isOpen: boolean;
  onClose: () => void;
}

export function EventDetailDialog({ event, isOpen, onClose }: EventDetailDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const queryClient = useQueryClient();

  // Event detaylarını çek
  const { data: eventDetails } = useQuery({
    queryKey: ["event-details", event?.extendedProps?.originalEventId],
    queryFn: async () => {
      const eventId = event?.extendedProps?.originalEventId;
      console.log("EventDetailDialog - Fetching event with ID:", eventId);
      
      if (!eventId) {
        console.error("EventDetailDialog - No event ID found!");
        return null;
      }
      
      const response = await fetch(`http://localhost:5000/api/playlist-schedules/${eventId}`);
      if (!response.ok) throw new Error("Event detayları yüklenemedi");
      
      const data = await response.json();
      console.log("EventDetailDialog - API Response:", data);
      
      // Event ID'sini ekle
      data._id = event.extendedProps.originalEventId;
      console.log("Fetched event details with ID:", data);
      return data;
    },
    enabled: !!event?.extendedProps?.originalEventId
  });

  // Event detaylarını izle
  useEffect(() => {
    if (eventDetails) {
      console.log("EventDetailDialog - Current event details:", eventDetails);
    }
  }, [eventDetails]);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!event?.extendedProps?.originalEventId) {
        throw new Error("Event ID bulunamadı");
      }

      console.log("Silme işlemi başlatıldı. Event ID:", event.extendedProps.originalEventId);
      
      const response = await fetch(`http://localhost:5000/api/playlist-schedules/${event.extendedProps.originalEventId}`, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json'
        }
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
      setShowDeleteDialog(false);
    },
    onError: (error: Error) => {
      console.error("Silme hatası:", error);
      toast.error(`Hata: ${error.message}`);
    },
  });

  const handleDelete = () => {
    if (!event?.extendedProps?.originalEventId) {
      toast.error("Event ID bulunamadı");
      return;
    }
    console.log("Silme işlemi tetiklendi, ID:", event.extendedProps.originalEventId);
    deleteMutation.mutate();
  };

  const handleEditSuccess = (savedEvent: any) => {
    console.log("EventDetailDialog - Edit success with event:", savedEvent);
    queryClient.invalidateQueries({ queryKey: ["playlist-schedules"] });
    queryClient.invalidateQueries({ queryKey: ["event-details", event?.extendedProps?.originalEventId] });
    setIsEditing(false);
    onClose();
  };

  // Eğer düzenleme modundaysa formu göster
  if (isEditing && eventDetails) {
    console.log("EventDetailDialog - Opening edit form with:", {
      eventId: event?.extendedProps?.originalEventId,
      eventDetails
    });
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Zamanlama Düzenle</DialogTitle>
            <DialogDescription asChild>
              <div>
                Zamanlama detaylarını güncelleyin.
              </div>
            </DialogDescription>
          </DialogHeader>
          <PlaylistScheduleForm
            initialData={{
              ...eventDetails,
              _id: event.extendedProps.originalEventId
            }}
            isEditing={true}
            onSuccess={handleEditSuccess}
            onClose={(success) => {
              if (success) {
                setIsEditing(false);
                onClose();
              }
            }}
          />
        </DialogContent>
      </Dialog>
    );
  }

  if (!event) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zamanlama Detayları</DialogTitle>
            <DialogDescription asChild>
              <div>
                Seçilen zamanlamanın detaylarını görüntüleyin ve yönetin.
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <h3 className="font-semibold">Playlist</h3>
              <p>{eventDetails?.playlist?.name || event.title}</p>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <h3 className="font-semibold">Başlangıç</h3>
              <p>{event.start ? format(new Date(event.start), "d MMMM yyyy HH:mm", { locale: tr }) : "-"}</p>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <h3 className="font-semibold">Bitiş</h3>
              <p>{event.end ? format(new Date(event.end), "d MMMM yyyy HH:mm", { locale: tr }) : "-"}</p>
            </div>

            <div className="flex items-center gap-2">
              <Repeat className="w-4 h-4 text-primary" />
              <h3 className="font-semibold">Tekrar</h3>
              <p>{eventDetails?.repeatType === "once" ? "Bir kez" : 
                 eventDetails?.repeatType === "daily" ? "Günlük" :
                 eventDetails?.repeatType === "weekly" ? "Haftalık" :
                 eventDetails?.repeatType === "monthly" ? "Aylık" : "-"}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <h3 className="font-semibold">Hedef Cihazlar</h3>
              </div>
              {eventDetails?.targets?.devices?.length > 0 ? (
                <ul className="list-disc list-inside pl-4">
                  {eventDetails.targets.devices.map((device: any) => (
                    <li key={device._id}>{device.name}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm">Hedef cihaz seçilmemiş</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <h3 className="font-semibold">Hedef Gruplar</h3>
              </div>
              {eventDetails?.targets?.groups?.length > 0 ? (
                <ul className="list-disc list-inside pl-4">
                  {eventDetails.targets.groups.map((group: any) => (
                    <li key={group._id}>{group.name}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm">Hedef grup seçilmemiş</p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline"
                onClick={() => setIsEditing(true)}
                disabled={deleteMutation.isPending}
              >
                <Edit className="w-4 h-4 mr-2" />
                Düzenle
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => setShowDeleteDialog(true)}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {deleteMutation.isPending ? "Siliniyor..." : "Sil"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog 
        open={showDeleteDialog} 
        onOpenChange={(open) => {
          if (!deleteMutation.isPending) {
            setShowDeleteDialog(open);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bu zamanlamayı silmek istediğinizden emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Bu zamanlama kalıcı olarak silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Siliniyor..." : "Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}