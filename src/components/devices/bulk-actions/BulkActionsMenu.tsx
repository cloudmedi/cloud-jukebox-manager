import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RefreshCcw, Volume2, PlaySquare, X } from "lucide-react";
import { useState } from "react";
import { BulkVolumeDialog } from "./BulkVolumeDialog";
import { BulkPlaylistDialog } from "./BulkPlaylistDialog";
import { toast } from "sonner";
import websocketService from "@/services/websocketService";

interface BulkActionsMenuProps {
  selectedDevices: string[];
  onClearSelection: () => void;
}

export const BulkActionsMenu = ({
  selectedDevices,
  onClearSelection,
}: BulkActionsMenuProps) => {
  const [isVolumeDialogOpen, setIsVolumeDialogOpen] = useState(false);
  const [isPlaylistDialogOpen, setIsPlaylistDialogOpen] = useState(false);

  const handleBulkRestart = async () => {
    if (!window.confirm('Seçili cihazları yeniden başlatmak istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/devices/bulk/restart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deviceIds: selectedDevices }),
      });

      if (!response.ok) {
        throw new Error("Cihazlar yeniden başlatılamadı");
      }

      toast.success("Seçili cihazlar yeniden başlatılıyor");
      onClearSelection();
    } catch (error) {
      toast.error("İşlem başarısız oldu");
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
      <span className="text-sm font-medium">
        {selectedDevices.length} cihaz seçildi
      </span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Toplu İşlemler
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleBulkRestart}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Yeniden Başlat
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsVolumeDialogOpen(true)}>
            <Volume2 className="mr-2 h-4 w-4" />
            Ses Seviyesi
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsPlaylistDialogOpen(true)}>
            <PlaySquare className="mr-2 h-4 w-4" />
            Playlist Ata
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="ghost"
        size="sm"
        onClick={onClearSelection}
        className="ml-auto"
      >
        <X className="h-4 w-4" />
      </Button>

      <BulkVolumeDialog
        open={isVolumeDialogOpen}
        onOpenChange={setIsVolumeDialogOpen}
        deviceIds={selectedDevices}
        onSuccess={onClearSelection}
      />

      <BulkPlaylistDialog
        open={isPlaylistDialogOpen}
        onOpenChange={setIsPlaylistDialogOpen}
        deviceIds={selectedDevices}
        onSuccess={onClearSelection}
      />
    </div>
  );
};