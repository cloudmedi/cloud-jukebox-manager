import { useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Power,
  RefreshCcw,
  Volume2,
  Users,
  Info,
  Trash2,
  MoreVertical,
  Play,
  Pause,
  AlertOctagon
} from "lucide-react";
import { useState } from "react";
import { deviceService } from "@/services/deviceService";
import type { Device } from "@/services/deviceService";
import VolumeControlDialog from "./VolumeControlDialog";
import GroupManagementDialog from "./GroupManagementDialog";
import DeviceDetailsDialog from "./DeviceDetailsDialog";
import websocketService from "@/services/websocketService";
import { toast } from "sonner";

interface DeviceActionsProps {
  device: Device;
}

const DeviceActions = ({ device }: DeviceActionsProps) => {
  const [isVolumeDialogOpen, setIsVolumeDialogOpen] = useState(false);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRestartDialogOpen, setIsRestartDialogOpen] = useState(false);
  const [isEmergencyDialogOpen, setIsEmergencyDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const handleEmergencyAction = async () => {
    try {
      setIsEmergencyDialogOpen(false);
      
      if (!device.emergencyStopped) {
        const response = await deviceService.emergencyStop();
        if (response.success) {
          toast.success('Acil durum komutu gönderildi. Tüm cihazlar durduruluyor.');
          queryClient.invalidateQueries({ queryKey: ['devices'] });
        } else {
          toast.error('Acil durum komutu gönderilemedi!');
        }
      } else {
        const response = await deviceService.emergencyReset();
        if (response.success) {
          toast.success('Acil durum kaldırıldı. Cihazlar normal çalışmaya devam ediyor.');
          queryClient.invalidateQueries({ queryKey: ['devices'] });
        } else {
          toast.error('Acil durum sıfırlama komutu gönderilemedi!');
        }
      }
    } catch (error) {
      console.error('Emergency action error:', error);
      toast.error('İşlem başarısız oldu');
    }
  };

  const handleRestart = async () => {
    try {
      websocketService.sendMessage({
        type: 'command',
        token: device.token,
        command: 'restart'
      });
      toast.success('Yeniden başlatma komutu gönderildi');
      setIsRestartDialogOpen(false);
    } catch (error) {
      console.error('Restart error:', error);
      toast.error('Yeniden başlatma komutu gönderilemedi');
    }
  };

  const handlePlayPause = async () => {
    try {
      websocketService.sendMessage({
        type: 'command',
        token: device.token,
        command: device.isPlaying ? 'pause' : 'play'
      });
      toast.success(`${device.isPlaying ? 'Durdurma' : 'Oynatma'} komutu gönderildi`);
    } catch (error) {
      console.error('Play/Pause error:', error);
      toast.error('Komut gönderilemedi');
    }
  };

  const handleVolumeChange = async (volume: number) => {
    try {
      websocketService.sendMessage({
        type: 'command',
        token: device.token,
        command: 'setVolume',
        volume: volume
      });
      setIsVolumeDialogOpen(false);
      toast.success('Ses seviyesi değiştirme komutu gönderildi');
    } catch (error) {
      console.error('Volume control error:', error);
      toast.error('Ses seviyesi değiştirme komutu gönderilemedi');
    }
  };

  const handleDelete = async () => {
    try {
      await deviceService.deleteDevice(device._id);
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      toast.success('Cihaz silindi');
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Cihaz silinemedi');
    }
  };

  const handleGroupChange = async (groupId: string | null) => {
    try {
      await deviceService.updateGroup(device._id, groupId);
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      toast.success('Grup güncellendi');
    } catch (error) {
      console.error('Group update error:', error);
      toast.error('Grup güncellenemedi');
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
          <DropdownMenuItem onClick={() => setIsEmergencyDialogOpen(true)}>
            <AlertOctagon className={`mr-2 h-4 w-4 ${device.emergencyStopped ? 'text-yellow-500' : 'text-red-500'}`} />
            {device.emergencyStopped ? 'Acil Durumu Kaldır' : 'Acil Durum'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handlePlayPause}>
            {device.isPlaying ? (
              <Pause className="mr-2 h-4 w-4" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            {device.isPlaying ? 'Durdur' : 'Oynat'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsRestartDialogOpen(true)}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Yeniden Başlat
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsVolumeDialogOpen(true)}>
            <Volume2 className="mr-2 h-4 w-4" />
            Ses Kontrolü
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsGroupDialogOpen(true)}>
            <Users className="mr-2 h-4 w-4" />
            Grup Yönetimi
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsDetailsDialogOpen(true)}>
            <Info className="mr-2 h-4 w-4" />
            Cihaz Detayları
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Cihazı Sil
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isEmergencyDialogOpen} onOpenChange={setIsEmergencyDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {device.emergencyStopped ? 'Acil Durumu Kaldır' : 'Acil Durum Durdurma'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {device.emergencyStopped 
                ? 'Bu işlem tüm cihazları normal çalışma durumuna döndürecek ve müzik yayınını devam ettirecektir. Devam etmek istediğinizden emin misiniz?' 
                : 'Bu işlem tüm cihazları durduracak ve ses çalmayı sonlandıracaktır. Bu işlem geri alınamaz ve sadece yönetici tarafından tekrar aktif edilebilir. Devam etmek istediğinizden emin misiniz?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleEmergencyAction}
              className={`${device.emergencyStopped ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {device.emergencyStopped ? 'Acil Durumu Kaldır' : 'Acil Durum Durdurma'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isVolumeDialogOpen} onOpenChange={setIsVolumeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ses Kontrolü</DialogTitle>
          </DialogHeader>
          <VolumeControlDialog
            currentVolume={device.volume}
            onVolumeChange={handleVolumeChange}
            onClose={() => setIsVolumeDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <GroupManagementDialog
        isOpen={isGroupDialogOpen}
        currentGroupId={device.groupId}
        onGroupChange={handleGroupChange}
        onClose={() => setIsGroupDialogOpen(false)}
      />

      <DeviceDetailsDialog
        device={device}
        isOpen={isDetailsDialogOpen}
        onClose={() => setIsDetailsDialogOpen(false)}
      />
    </>
  );
};

export default DeviceActions;
