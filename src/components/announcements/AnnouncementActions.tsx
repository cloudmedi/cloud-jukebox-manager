import { useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Pencil,
  Trash2,
  MoreVertical,
  Send,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AnnouncementForm } from "./AnnouncementForm";
import websocketService from "@/services/websocketService";
import { AnnouncementFormData, ScheduleType } from "./form/types";

interface Announcement {
  _id: string;
  title: string;
  content: string;
  status: string;
  targetDevices: Array<{
    _id: string;
    name: string;
    token: string;
  }>;
  targetGroups: string[];
  startDate: string;
  endDate: string;
  scheduleType: ScheduleType;
  specificTimes?: string[];
  songInterval?: number;
  minuteInterval?: number;
  immediateInterrupt: boolean;
  duration: number;
  audioFile: string;
}

interface AnnouncementActionsProps {
  announcement: Announcement;
}

export const AnnouncementActions = ({ announcement }: AnnouncementActionsProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const handleDelete = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/announcements/${announcement._id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Anons silinirken bir hata oluştu');
      }

      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast.success('Anons başarıyla silindi');
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Anons silinemedi');
    }
  };

  const handleSendToDevices = async () => {
    try {
      // Hedef cihazlara anonsu gönder
      announcement.targetDevices.forEach(device => {
        websocketService.sendMessage({
          type: 'command',
          command: 'playAnnouncement',
          token: device.token,
          announcement: {
            _id: announcement._id,
            title: announcement.title,
            content: announcement.content,
            audioFile: announcement.audioFile,
            duration: announcement.duration,
            immediateInterrupt: announcement.immediateInterrupt,
            startDate: announcement.startDate,
            endDate: announcement.endDate,
            scheduleType: announcement.scheduleType,
            specificTimes: announcement.specificTimes,
            songInterval: announcement.songInterval,
            minuteInterval: announcement.minuteInterval
          }
        });
      });

      // Hedef gruplardaki cihazlara anonsu gönder
      announcement.targetGroups.forEach(groupId => {
        websocketService.sendMessage({
          type: 'command',
          command: 'playAnnouncementToGroup',
          groupId,
          announcement: {
            _id: announcement._id,
            title: announcement.title,
            content: announcement.content,
            audioFile: announcement.audioFile,
            duration: announcement.duration,
            immediateInterrupt: announcement.immediateInterrupt,
            startDate: announcement.startDate,
            endDate: announcement.endDate,
            scheduleType: announcement.scheduleType,
            specificTimes: announcement.specificTimes,
            songInterval: announcement.songInterval,
            minuteInterval: announcement.minuteInterval
          }
        });
      });

      toast.success('Anons cihazlara gönderildi');
    } catch (error) {
      console.error('Send error:', error);
      toast.error('Anons gönderilemedi');
    }
  };

  const convertToFormData = (announcement: Announcement): Partial<AnnouncementFormData> => {
    return {
      _id: announcement._id,
      title: announcement.title,
      content: announcement.content,
      startDate: new Date(announcement.startDate),
      endDate: new Date(announcement.endDate),
      scheduleType: announcement.scheduleType,
      targetDevices: announcement.targetDevices.map(device => device._id),
      targetGroups: announcement.targetGroups,
      songInterval: announcement.songInterval,
      minuteInterval: announcement.minuteInterval,
      specificTimes: announcement.specificTimes || [],
      immediateInterrupt: announcement.immediateInterrupt,
      duration: announcement.duration,
      audioFile: undefined
    };
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-background border shadow-lg">
          <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Düzenle
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSendToDevices}>
            <Send className="mr-2 h-4 w-4" />
            Cihazlara Gönder
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Sil
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anons Düzenle</DialogTitle>
          </DialogHeader>
          <AnnouncementForm 
            initialData={convertToFormData(announcement)}
            mode="update"
            onSuccess={() => {
              setIsEditDialogOpen(false);
              queryClient.invalidateQueries({ queryKey: ['announcements'] });
            }} 
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle>Anonsu Silmek İstediğinize Emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              "{announcement.title}" başlıklı anons kalıcı olarak silinecek. Bu işlem geri alınamaz.
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
};