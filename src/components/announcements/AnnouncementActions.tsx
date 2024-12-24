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
  Pencil,
  Trash2,
  MoreVertical,
  Send,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AnnouncementForm } from "./AnnouncementForm";
import websocketService from "@/services/websocketService";
import { AnnouncementFormData } from "./form/types";

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
  scheduleType: string;
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
  const queryClient = useQueryClient();

  const handleDelete = async () => {
    if (!window.confirm('Anonsu silmek istediğinizden emin misiniz?')) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/announcements/${announcement._id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Anons silinirken bir hata oluştu');
      }

      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast.success('Anons başarıyla silindi');
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
          token: device.token, // Düzeltme: device.token kullanıyoruz
          announcement: {
            _id: announcement._id,
            title: announcement.title,
            content: announcement.content,
            audioFile: announcement.audioFile,
            duration: announcement.duration,
            immediateInterrupt: announcement.immediateInterrupt
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
            immediateInterrupt: announcement.immediateInterrupt
          }
        });
      });

      toast.success('Anons cihazlara gönderildi');
    } catch (error) {
      console.error('Send error:', error);
      toast.error('Anons gönderilemedi');
    }
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
          <DropdownMenuItem onClick={handleDelete} className="text-destructive">
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
            initialData={announcement}
            mode="update"
            onSuccess={() => {
              setIsEditDialogOpen(false);
              queryClient.invalidateQueries({ queryKey: ['announcements'] });
            }} 
          />
        </DialogContent>
      </Dialog>
    </>
  );
};