import React from "react";
import { Slider } from "@/components/ui/slider";
import { Volume2 } from "lucide-react";

interface VolumeSliderProps {
  volume: number;
  onVolumeChange: (values: number[]) => void;
}

const VolumeSlider = ({ volume, onVolumeChange }: VolumeSliderProps) => {
  return (
    <div className="flex items-center gap-4 mb-6">
      <Volume2 className="h-5 w-5 shrink-0" />
      <div className="relative w-full">
        <Slider
          value={[volume]}
          onValueChange={onVolumeChange}
          max={100}
          step={1}
          className="w-full"
          aria-label="Ses seviyesi"
        />
        <div 
          className="absolute -top-6 left-0 text-sm"
          style={{ left: `${volume}%`, transform: 'translateX(-50%)' }}
        >
          {volume}%
        </div>
      </div>
    </div>
  );
};

export default VolumeSlider;