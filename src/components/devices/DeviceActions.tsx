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
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const queryClient = useQueryClient();

  const handleEmergencyAction = async () => {
    try {
      if (!isEmergencyActive) {
        // Emergency Stop
        await deviceService.emergencyStop();
        setIsEmergencyActive(true);
        toast.success('Acil durum aktifleştirildi. Tüm cihazlar durduruldu.');
      } else {
        // Emergency Reset - Resume playback
        await deviceService.emergencyReset();
        setIsEmergencyActive(false);
        toast.success('Acil durum kaldırıldı. Cihazlar normal çalışmaya devam ediyor.');
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
          <DropdownMenuItem onClick={handlePlayPause}>
            {device.isPlaying ? (
              <>
                <Pause className="mr-2 h-4 w-4" />
                Duraklat
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Oynat
              </>
            )}
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
          <DropdownMenuItem onClick={handleEmergencyAction}>
            <AlertOctagon className={`mr-2 h-4 w-4 ${isEmergencyActive ? 'text-red-500' : ''}`} />
            {isEmergencyActive ? 'Acil Durumu Kaldır' : 'Acil Durum Durdurma'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Cihazı Sil
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cihazı silmek istediğinizden emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Cihaz kalıcı olarak silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isRestartDialogOpen} onOpenChange={setIsRestartDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cihazı yeniden başlatmak istediğinizden emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Cihaz yeniden başlatılacak ve geçici olarak çevrimdışı olacaktır.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestart}>
              Yeniden Başlat
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
