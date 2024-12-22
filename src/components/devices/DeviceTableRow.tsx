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

interface Device {
  _id: string;
  name: string;
  token: string;
  location: string;
  ipAddress: string;
  isOnline: boolean;
  volume: number;
  lastSeen: string;
  activePlaylist: {
    _id: string;
    name: string;
  } | null;
  playlistStatus?: 'loaded' | 'loading' | 'error';
}

interface DeviceTableRowProps {
  device: Device;
  style?: React.CSSProperties;
}

export const DeviceTableRow = ({ device, style }: DeviceTableRowProps) => {
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

  const handleRestart = () => {
    console.log('Restart device:', device._id);
    // API call to restart device
  };

  const handlePowerToggle = () => {
    console.log('Toggle power for device:', device._id);
    // API call to toggle power
  };

  const handlePlaylistManagement = () => {
    console.log('Manage playlist for device:', device._id);
    // Open playlist management dialog
  };

  const handleVolumeControl = () => {
    console.log('Control volume for device:', device._id);
    // Open volume control dialog
  };

  const handleGroupManagement = () => {
    console.log('Manage group for device:', device._id);
    // Open group management dialog
  };

  const handleDeviceDetails = () => {
    console.log('View details for device:', device._id);
    // Navigate to device details page
  };

  const handleEmergencyStop = () => {
    console.log('Emergency stop for device:', device._id);
    // API call for emergency stop
  };

  const handleDelete = () => {
    console.log('Delete device:', device._id);
    // Open delete confirmation dialog
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
            <DropdownMenuItem onClick={handlePlaylistManagement}>
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
            <DropdownMenuItem onClick={handleDeviceDetails}>
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
