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
  Power,
  RefreshCcw,
  Volume2,
  Users,
  Info,
  Trash2,
  MoreVertical,
  Play,
  Pause,
} from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { deviceService, Device } from "@/services/deviceService";
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
  const queryClient = useQueryClient();

  const handleRestart = useCallback(async () => {
    if (!window.confirm('Cihazı yeniden başlatmak istediğinizden emin misiniz?')) return;
    
    try {
      websocketService.sendMessage({
        type: 'command',
        token: device.token,
        command: 'restart'
      });
      toast.success('Yeniden başlatma komutu gönderildi');
    } catch (error) {
      console.error('Restart error:', error);
      toast.error('Yeniden başlatma komutu gönderilemedi');
    }
  }, [device.token]);

  const handlePlayPause = useCallback(async () => {
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
  }, [device.token, device.isPlaying]);

  const handleVolumeChange = useCallback(async (volume: number) => {
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
  }, [device.token]);

  const handlePowerToggle = useCallback(async () => {
    try {
      await deviceService.togglePower(device._id, device.isOnline);
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    } catch (error) {
      console.error('Power toggle error:', error);
      toast.error('Güç durumu değiştirilemedi');
    }
  }, [device._id, device.isOnline, queryClient]);

  const handleGroupChange = useCallback(async (groupId: string | null) => {
    try {
      await deviceService.updateGroup(device._id, groupId);
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      queryClient.invalidateQueries({ queryKey: ['device-groups'] });
      setIsGroupDialogOpen(false);
      toast.success('Grup güncellendi');
    } catch (error) {
      console.error('Group management error:', error);
      toast.error('Grup güncellenemedi');
    }
  }, [device._id, queryClient]);

  const handleDelete = useCallback(async () => {
    if (!window.confirm('Cihazı silmek istediğinizden emin misiniz?')) return;
    
    try {
      await deviceService.deleteDevice(device._id);
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      toast.success('Cihaz silindi');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Cihaz silinemedi');
    }
  }, [device._id, queryClient]);

  useEffect(() => {
    return () => {
      // Cleanup any subscriptions or event listeners here
      setIsVolumeDialogOpen(false);
      setIsGroupDialogOpen(false);
      setIsDetailsDialogOpen(false);
    };
  }, []);

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
              <Pause className="mr-2 h-4 w-4" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            {device.isPlaying ? 'Durdur' : 'Oynat'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handlePowerToggle}>
            <Power className="mr-2 h-4 w-4" />
            {device.isOnline ? 'Kapat' : 'Aç'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleRestart}>
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
          <DropdownMenuItem onClick={handleDelete} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Cihazı Sil
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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