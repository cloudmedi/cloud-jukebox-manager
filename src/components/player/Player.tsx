import { useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

const Player = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);

  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border/40">
      <div className="container mx-auto h-full flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-muted rounded-md" />
          <div>
            <h4 className="font-medium">Song Title</h4>
            <p className="text-sm text-muted-foreground">Artist Name</p>
          </div>
        </div>
        
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <SkipBack className="h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-10 w-10"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>
            <Button variant="ghost" size="icon">
              <SkipForward className="h-5 w-5" />
            </Button>
          </div>
          <div className="w-96 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">1:23</span>
            <Slider
              defaultValue={[33]}
              max={100}
              step={1}
              className="w-full"
            />
            <span className="text-sm text-muted-foreground">3:45</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          <Slider
            value={[volume]}
            onValueChange={(value) => setVolume(value[0])}
            max={100}
            step={1}
            className="w-28"
          />
        </div>
      </div>
    </div>
  );
};

export default Player;