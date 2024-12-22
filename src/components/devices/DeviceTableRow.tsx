import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { 
  RefreshCw, 
  Power,
  Music,
  Volume2,
  Users,
  Info,
  StopCircle,
  Trash2,
  MoreVertical,
  Check,
  Loader,
  AlertCircle
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { deviceService, Device } from "@/services/deviceService";
import { useQueryClient } from "@tanstack/react-query";

interface DeviceTableRowProps {
  device: Device;
  style?: React.CSSProperties;
}

export const DeviceTableRow = ({ device, style }: DeviceTableRowProps) => {
  const queryClient = useQueryClient();

  const handleRestart = async () => {
    try {
      await deviceService.restartDevice(device._id);
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    } catch (error) {
      console.error('Restart error:', error);
    }
  };

  const handlePowerToggle = async () => {
    try {
      await deviceService.togglePower(device._id, device.isOnline);
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    } catch (error) {
      console.error('Power toggle error:', error);
    }
  };

  const handleVolumeControl = async () => {
    // Bu kısım için ayrı bir dialog component'i oluşturulabilir
    const volume = window.prompt('Ses seviyesini girin (0-100):', device.volume.toString());
    if (volume === null) return;
    
    const newVolume = parseInt(volume);
    if (isNaN(newVolume) || newVolume < 0 || newVolume > 100) {
      alert('Geçersiz ses seviyesi! 0-100 arası bir değer girin.');
      return;
    }

    try {
      await deviceService.setVolume(device._id, newVolume);
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    } catch (error) {
      console.error('Volume control error:', error);
    }
  };

  const handleGroupManagement = async () => {
    // Bu kısım için ayrı bir dialog component'i oluşturulabilir
    const groupId = window.prompt('Grup ID girin (boş bırakarak gruptan çıkarabilirsiniz):', device.groupId?.toString() || '');
    
    try {
      await deviceService.updateGroup(device._id, groupId || null);
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    } catch (error) {
      console.error('Group management error:', error);
    }
  };

  const handleEmergencyStop = async () => {
    if (!window.confirm('Cihazı acil olarak durdurmak istediğinizden emin misiniz?')) return;
    
    try {
      await deviceService.emergencyStop(device._id);
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    } catch (error) {
      console.error('Emergency stop error:', error);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Cihazı silmek istediğinizden emin misiniz?')) return;
    
    try {
      await deviceService.deleteDevice(device._id);
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const getPlaylistStatusBadge = () => {
    if (!device.activePlaylist) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Music className="h-3 w-3" />
          Playlist Atanmamış
        </Badge>
      );
    }

    switch (device.playlistStatus) {
      case 'loaded':
        return (
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="success" className="flex items-center gap-1">
                <Check className="h-3 w-3" />
                Yüklendi
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{device.activePlaylist.name}</p>
            </TooltipContent>
          </Tooltip>
        );
      case 'loading':
        return (
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="warning" className="flex items-center gap-1">
                <Loader className="h-3 w-3 animate-spin" />
                Yükleniyor
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{device.activePlaylist.name}</p>
            </TooltipContent>
          </Tooltip>
        );
      case 'error':
        return (
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Hata
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Playlist yüklenirken hata oluştu</p>
            </TooltipContent>
          </Tooltip>
        );
      default:
        return (
          <Badge variant="secondary">
            Durum Bilinmiyor
          </Badge>
        );
    }
  };

  return (
    <TableRow style={style}>
      <TableCell className="font-medium">{device.name}</TableCell>
      <TableCell>{device.token}</TableCell>
      <TableCell>{device.location}</TableCell>
      <TableCell>{device.ipAddress || "-"}</TableCell>
      <TableCell>
        <Badge
          variant={device.isOnline ? "success" : "secondary"}
          className="flex w-fit items-center gap-1"
        >
          <Power className="h-3 w-3" />
          {device.isOnline ? "Çevrimiçi" : "Çevrimdışı"}
        </Badge>
      </TableCell>
      <TableCell>{getPlaylistStatusBadge()}</TableCell>
      <TableCell>{device.volume}%</TableCell>
      <TableCell>
        {new Date(device.lastSeen).toLocaleString("tr-TR")}
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleRestart}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Yeniden Başlat
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handlePowerToggle}>
              <Power className="mr-2 h-4 w-4" />
              {device.isOnline ? 'Cihazı Kapat' : 'Cihazı Aç'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => console.log('Playlist management')}>
              <Music className="mr-2 h-4 w-4" />
              Playlist Yönetimi
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleVolumeControl}>
              <Volume2 className="mr-2 h-4 w-4" />
              Ses Kontrolü
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleGroupManagement}>
              <Users className="mr-2 h-4 w-4" />
              Grup Yönetimi
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => console.log('Device details')}>
              <Info className="mr-2 h-4 w-4" />
              Cihaz Detayları
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleEmergencyStop} className="text-red-600">
              <StopCircle className="mr-2 h-4 w-4" />
              Acil Durdur
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete} className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Cihazı Sil
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};
