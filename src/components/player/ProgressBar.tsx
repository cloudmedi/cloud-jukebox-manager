import * as Slider from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  progress: number;
  duration: number;
  onSeek: (value: number[]) => void;
}

const ProgressBar = ({ progress, duration, onSeek }: ProgressBarProps) => {
  return (
    <Slider.Root
      className="relative flex w-full touch-none select-none items-center group cursor-pointer"
      defaultValue={[0]}
      value={[progress]}
      max={duration}
      step={0.1}
      onValueChange={onSeek}
      aria-label="Progress"
    >
      <Slider.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-secondary/20 group-hover:bg-secondary/30 transition-all duration-300">
        <Slider.Range className="absolute h-full bg-primary/50 group-hover:bg-primary/70 group-hover:shadow-glow transition-all duration-300" />
      </Slider.Track>
      <Slider.Thumb className="hidden group-hover:block h-3 w-3 rounded-full border border-primary bg-background ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:scale-110" />
    </Slider.Root>
  );
};

export default ProgressBar;