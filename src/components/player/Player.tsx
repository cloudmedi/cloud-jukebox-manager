import { useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useIsMobile } from "@/hooks/use-mobile";

const Player = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const isMobile = useIsMobile();

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    if (value[0] > 0) setIsMuted(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border/40">
      <div className={`mx-auto h-full flex items-center ${isMobile ? 'px-2 flex-col justify-center gap-2 h-auto py-4' : 'container px-4 justify-between'}`}>
        <div className={`flex items-center gap-4 ${isMobile ? 'w-full justify-between' : ''}`}>
          <div className="w-12 h-12 bg-muted rounded-md shrink-0" />
          <div className="min-w-0">
            <h4 className="font-medium truncate">Şarkı Adı</h4>
            <p className="text-sm text-muted-foreground truncate">Sanatçı</p>
          </div>
        </div>
        
        <div className={`flex flex-col items-center gap-2 ${isMobile ? 'w-full' : ''}`}>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="shrink-0">
              <SkipBack className="h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-10 w-10 shrink-0"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>
            <Button variant="ghost" size="icon" className="shrink-0">
              <SkipForward className="h-5 w-5" />
            </Button>
          </div>
          <div className={`flex items-center gap-2 ${isMobile ? 'w-full' : 'w-96'}`}>
            <span className="text-sm text-muted-foreground shrink-0">{formatTime(progress)}</span>
            <Slider
              value={[progress]}
              onValueChange={(value) => setProgress(value[0])}
              max={225}
              step={1}
              className="w-full"
            />
            <span className="text-sm text-muted-foreground shrink-0">3:45</span>
          </div>
        </div>
        
        <div className={`flex items-center gap-2 ${isMobile ? 'w-full justify-end' : ''}`}>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={toggleMute}
            className="shrink-0"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-5 w-5" />
            ) : (
              <Volume2 className="h-5 w-5" />
            )}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            onValueChange={handleVolumeChange}
            max={100}
            step={1}
            className={`${isMobile ? 'w-32' : 'w-28'}`}
          />
        </div>
      </div>
    </div>
  );
};

export default Player;