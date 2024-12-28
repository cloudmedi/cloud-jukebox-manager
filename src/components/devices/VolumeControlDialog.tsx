import { useState, useEffect } from "react";
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Volume2 } from "lucide-react";

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

  useEffect(() => {
    // Update local state when currentVolume prop changes
    setVolume(currentVolume);
  }, [currentVolume]);

  const handleVolumeChange = (values: number[]) => {
    const newVolume = Math.max(0, Math.min(100, values[0]));
    setVolume(newVolume);
  };

  const handleSave = () => {
    onVolumeChange(volume);
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Ses Seviyesi Kontrolü</DialogTitle>
      </DialogHeader>
      <div className="py-6">
        <div className="flex items-center gap-4 mb-6">
          <Volume2 className="h-5 w-5" />
          <Slider
            value={[volume]}
            onValueChange={handleVolumeChange}
            max={100}
            min={0}
            step={1}
            className="w-full"
          />
          <span className="min-w-[3ch]">%{volume}</span>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            İptal
          </Button>
          <Button onClick={handleSave}>
            Kaydet
          </Button>
        </div>
      </div>
    </DialogContent>
  );
};

export default VolumeControlDialog;