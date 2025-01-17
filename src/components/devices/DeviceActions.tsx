import { useState } from "react";
import { deviceService } from "@/services/deviceService";
import type { Device } from "@/types/device";
import websocketService from "@/services/websocketService";
import { toast } from "sonner";
import { DeviceActionMenu } from "./actions/DeviceActionMenu";
import { DeviceActionDialogs } from "./actions/DeviceActionDialogs";
import { ScreenshotDialog } from "./actions/ScreenshotDialog";
import { useQueryClient } from "@tanstack/react-query";

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
  const [isScreenshotDialogOpen, setIsScreenshotDialogOpen] = useState(false);
  const [screenshotData, setScreenshotData] = useState<string>();
  const queryClient = useQueryClient();

  const handleScreenshot = () => {
    setIsScreenshotDialogOpen(true);
    setScreenshotData(undefined);

    websocketService.sendMessage({
      type: 'command',
      token: device.token,
      command: 'screenshot'
    });

    // Listen for screenshot response
    const handleScreenshotResponse = (message: any) => {
      if (message.type === 'screenshot' && message.token === device.token) {
        setScreenshotData(message.data);
        websocketService.removeMessageHandler('screenshot', handleScreenshotResponse);
      }
    };

    websocketService.addMessageHandler('screenshot', handleScreenshotResponse);
  };

  // Clear screenshot data when dialog closes
  const handleScreenshotDialogChange = (open: boolean) => {
    setIsScreenshotDialogOpen(open);
    if (!open) {
      setScreenshotData(undefined);
    }
  };

  const handleEmergencyAction = async () => {
    try {
      if (!isEmergencyActive) {
        await deviceService.emergencyStop();
        setIsEmergencyActive(true);
        toast.success('Acil durum aktifleştirildi. Tüm cihazlar durduruldu.');
      } else {
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
      console.log('PlayPause - Current device state:', {
        deviceId: device._id,
        deviceName: device.name,
        isPlaying: device.isPlaying,
        isOnline: device.isOnline,
        token: device.token
      });

      const command = device.isPlaying ? 'pause' : 'play';
      console.log('PlayPause - Sending command:', command);

      // Komut mesajını gönder
      websocketService.sendMessage({
        type: 'command',
        token: device.token,
        command: command
      });

      // Durumu güncelle
      queryClient.setQueryData(['devices'], (oldData: Device[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(d => {
          if (d._id === device._id) {
            return { ...d, isPlaying: !device.isPlaying };
          }
          return d;
        });
      });

      toast.success(`Müzik ${command === 'play' ? 'başlatıldı' : 'duraklatıldı'}`);
    } catch (error) {
      console.error('PlayPause error:', error);
      toast.error('Komut gönderilemedi');
    }
  };

  const handleVolumeChange = async (volume: number) => {
    try {
      console.log('Volume change requested:', { deviceId: device._id, volume });

      // Backend'e gönder
      await deviceService.updateDevice(device._id, { volume });
      console.log('Volume updated in backend');

      // WebSocket üzerinden cihaza gönder
      websocketService.sendMessage({
        type: 'command',
        token: device.token,
        command: 'setVolume',
        volume: volume
      });
      console.log('Volume command sent via WebSocket');

      setIsVolumeDialogOpen(false);
      toast.success('Ses seviyesi değiştirme komutu gönderildi');

      // Query'yi invalidate et
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      console.log('Devices query invalidated');
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
      <DeviceActionMenu
        device={device}
        isEmergencyActive={isEmergencyActive}
        onPlayPause={handlePlayPause}
        onVolumeClick={() => setIsVolumeDialogOpen(true)}
        onGroupClick={() => setIsGroupDialogOpen(true)}
        onDetailsClick={() => setIsDetailsDialogOpen(true)}
        onRestartClick={() => setIsRestartDialogOpen(true)}
        onDeleteClick={() => setIsDeleteDialogOpen(true)}
        onEmergencyClick={handleEmergencyAction}
        onScreenshotClick={handleScreenshot}
      />

      <DeviceActionDialogs
        device={device}
        isVolumeDialogOpen={isVolumeDialogOpen}
        isGroupDialogOpen={isGroupDialogOpen}
        isDetailsDialogOpen={isDetailsDialogOpen}
        isDeleteDialogOpen={isDeleteDialogOpen}
        isRestartDialogOpen={isRestartDialogOpen}
        onVolumeDialogChange={setIsVolumeDialogOpen}
        onGroupDialogChange={setIsGroupDialogOpen}
        onDetailsDialogChange={setIsDetailsDialogOpen}
        onDeleteDialogChange={setIsDeleteDialogOpen}
        onRestartDialogChange={setIsRestartDialogOpen}
        onVolumeChange={handleVolumeChange}
        onGroupChange={handleGroupChange}
        onDelete={handleDelete}
        onRestart={handleRestart}
      />

      <ScreenshotDialog
        isOpen={isScreenshotDialogOpen}
        onOpenChange={handleScreenshotDialogChange}
        deviceName={device.name}
        screenshotData={screenshotData}
      />
    </>
  );
};

export default DeviceActions;
