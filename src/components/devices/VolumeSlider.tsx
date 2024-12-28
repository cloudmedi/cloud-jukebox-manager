import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface VolumeSliderProps {
  initialVolume: number;
  onVolumeChange: (volume: number) => void;
  className?: string;
}

export const VolumeSlider = ({ initialVolume, onVolumeChange, className }: VolumeSliderProps) => {
  return (
    <div className={cn("bg-popover p-2 rounded-lg shadow-lg w-48", className)}>
      <Slider
        defaultValue={[initialVolume]}
        max={100}
        step={1}
        onValueChange={(values) => onVolumeChange(values[0])}
        className="w-full"
      />
    </div>
  );
};