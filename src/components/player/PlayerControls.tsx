import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PlayerControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

const PlayerControls = ({ isPlaying, onPlayPause, onNext, onPrevious }: PlayerControlsProps) => {
  return (
    <div className="flex items-center gap-4">
      <Button 
        variant="ghost" 
        size="icon" 
        className="shrink-0"
        onClick={onPrevious}
      >
        <SkipBack className="h-5 w-5" />
      </Button>
      <Button 
        variant="outline" 
        size="icon" 
        className="h-10 w-10 shrink-0"
        onClick={onPlayPause}
      >
        {isPlaying ? (
          <Pause className="h-5 w-5" />
        ) : (
          <Play className="h-5 w-5" />
        )}
      </Button>
      <Button 
        variant="ghost" 
        size="icon" 
        className="shrink-0"
        onClick={onNext}
      >
        <SkipForward className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default PlayerControls;