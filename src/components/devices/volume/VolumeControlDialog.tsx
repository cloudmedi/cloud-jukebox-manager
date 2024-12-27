import React, { useState } from "react";
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import VolumeSlider from "./VolumeSlider";
import VolumeActions from "./VolumeActions";

interface VolumeControlDialogProps {
  currentVolume: number;
  onVolumeChange: (volume: number) => void;
  onClose: () => void;
}

const VolumeControlDialog = ({
  currentVolume,
  onVolumeChange,
  onClose,
}: VolumeControlDialogProps) => {
  const [volume, setVolume] = useState(currentVolume);
  const [isLoading, setIsLoading] = useState(false);

  const handleVolumeChange = (values: number[]) => {
    setVolume(values[0]);
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await onVolumeChange(volume);
      toast.success("Ses seviyesi güncellendi");
      onClose();
    } catch (error) {
      toast.error("Ses seviyesi güncellenirken bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Ses Seviyesi Kontrolü</DialogTitle>
      </DialogHeader>
      <div className="py-6">
        <VolumeSlider 
          volume={volume} 
          onVolumeChange={handleVolumeChange} 
        />
        <VolumeActions
          onClose={onClose}
          onSave={handleSave}
          isLoading={isLoading}
        />
      </div>
    </DialogContent>
  );
};

export default VolumeControlDialog;