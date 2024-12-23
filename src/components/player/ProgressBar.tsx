import { Slider } from "@/components/ui/slider";

interface ProgressBarProps {
  progress: number;
  duration: number;
  onSeek: (value: number[]) => void;
}

const ProgressBar = ({ progress, duration, onSeek }: ProgressBarProps) => {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2 w-full">
      <span className="text-sm text-muted-foreground shrink-0">
        {formatTime(progress)}
      </span>
      <Slider
        value={[progress]}
        onValueChange={onSeek}
        max={duration}
        step={1}
        className="w-full"
      />
      <span className="text-sm text-muted-foreground shrink-0">
        {formatTime(duration)}
      </span>
    </div>
  );
};

export default ProgressBar;