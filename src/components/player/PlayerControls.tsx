import { Button } from "@/components/ui/button";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";

interface PlayerControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

const PlayerControls = ({
  isPlaying,
  onPlayPause,
  onNext,
  onPrevious,
}: PlayerControlsProps) => {
  return (
    <div className="flex items-center gap-4">
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 hover:scale-110 transition-all hover:bg-primary/10"
        onClick={onPrevious}
      >
        <SkipBack className="h-5 w-5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-12 w-12 rounded-full hover:scale-110 transition-all bg-primary/10 hover:bg-primary hover:text-primary-foreground"
        onClick={onPlayPause}
      >
        {isPlaying ? (
          <Pause className="h-6 w-6" />
        ) : (
          <Play className="h-6 w-6 ml-0.5" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 hover:scale-110 transition-all hover:bg-primary/10"
        onClick={onNext}
      >
        <SkipForward className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default PlayerControls;