import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";
import { toast } from "sonner";
import websocketService from "@/services/websocketService";

interface BulkVolumeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deviceIds: string[];
  onSuccess: () => void;
}

export const BulkVolumeDialog = ({
  open,
  onOpenChange,
  deviceIds,
  onSuccess,
}: BulkVolumeDialogProps) => {
  const [volume, setVolume] = useState(50);

  const handleSubmit = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/devices/bulk/volume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deviceIds,
          volume,
        }),
      });

      if (!response.ok) {
        throw new Error("Ses seviyesi güncellenemedi");
      }

      toast.success("Ses seviyesi güncellendi");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error("İşlem başarısız oldu");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ses Seviyesini Ayarla</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="flex items-center gap-4">
            <Slider
              value={[volume]}
              onValueChange={(value) => setVolume(value[0])}
              max={100}
              step={1}
            />
            <span className="w-12 text-right">{volume}%</span>
          </div>
          <Button onClick={handleSubmit} className="w-full">
            Uygula
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};