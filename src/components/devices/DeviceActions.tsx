import { useEffect, useCallback } from 'react';
import { useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { deviceService, Device } from "@/services/deviceService";
import websocketService from "@/services/websocketService";
import { toast } from "sonner";
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

interface DeviceActionsProps {
  device: Device;
}

const DeviceActions = ({ device }: DeviceActionsProps) => {
  const queryClient = useQueryClient();

  const handleVolumeChange = useCallback((data: any) => {
    if (data.deviceId === device._id) {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    }
  }, [device._id, queryClient]);

  const handlePlaybackChange = useCallback((data: any) => {
    if (data.deviceId === device._id) {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    }
  }, [device._id, queryClient]);

  useEffect(() => {
    websocketService.addMessageHandler('volumeChange', handleVolumeChange);
    websocketService.addMessageHandler('playbackChange', handlePlaybackChange);

    return () => {
      websocketService.removeMessageHandler('volumeChange', handleVolumeChange);
      websocketService.removeMessageHandler('playbackChange', handlePlaybackChange);
    };
  }, [handleVolumeChange, handlePlaybackChange]);

  const handleAction = async (action: string) => {
    try {
      switch (action) {
        case 'restart':
          websocketService.sendMessage({
            type: 'command',
            token: device.token,
            command: 'restart'
          });
          toast.success('Yeniden başlatma komutu gönderildi');
          break;

        case 'playPause':
          websocketService.sendMessage({
            type: 'command',
            token: device.token,
            command: device.isPlaying ? 'pause' : 'play'
          });
          toast.success(`${device.isPlaying ? 'Durdurma' : 'Oynatma'} komutu gönderildi`);
          break;

        case 'power':
          await deviceService.togglePower(device._id, device.isOnline);
          queryClient.invalidateQueries({ queryKey: ['devices'] });
          toast.success(`Cihaz ${device.isOnline ? 'kapatıldı' : 'açıldı'}`);
          break;

        case 'delete':
          if (window.confirm('Cihazı silmek istediğinizden emin misiniz?')) {
            await deviceService.deleteDevice(device._id);
            queryClient.invalidateQueries({ queryKey: ['devices'] });
            toast.success('Cihaz silindi');
          }
          break;
      }
    } catch (error) {
      console.error('Action error:', error);
      toast.error('İşlem başarısız oldu');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => handleAction('playPause')}>
          {device.isPlaying ? (
            <Pause className="mr-2 h-4 w-4" />
          ) : (
            <Play className="mr-2 h-4 w-4" />
          )}
          {device.isPlaying ? 'Durdur' : 'Oynat'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleAction('power')}>
          <Power className="mr-2 h-4 w-4" />
          {device.isOnline ? 'Kapat' : 'Aç'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleAction('restart')}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Yeniden Başlat
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleAction('delete')} className="text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Cihazı Sil
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DeviceActions;