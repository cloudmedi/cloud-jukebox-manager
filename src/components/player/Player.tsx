import { useState, useEffect, useRef } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePlaybackStore } from "@/store/playbackStore";

const Player = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const isMobile = useIsMobile();
  
  const { currentSong, next, previous } = usePlaybackStore();

  useEffect(() => {
    if (currentSong && audioRef.current) {
      const audioPath = currentSong.filePath ? `http://localhost:5000/${currentSong.filePath}` : currentSong.localPath;
      if (!audioPath) {
        console.error('No valid audio path found for song:', currentSong);
        return;
      }

      audioRef.current.src = audioPath;
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(error => {
        console.error('Playback error:', error);
      });
    }
  }, [currentSong]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setProgress(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      next();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [next]);

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleNext = () => {
    next();
  };

  const handlePrevious = () => {
    previous();
  };

  const handleVolumeChange = (value: number[]) => {
    if (audioRef.current) {
      setVolume(value[0]);
      audioRef.current.volume = value[0] / 100;
      if (value[0] > 0) setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setProgress(value[0]);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!currentSong) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border/40">
      <audio ref={audioRef} />
      <div className={`mx-auto h-full flex items-center ${isMobile ? 'px-2 flex-col justify-center gap-2 h-auto py-4' : 'container px-4 justify-between'}`}>
        <div className={`flex items-center gap-4 ${isMobile ? 'w-full justify-between' : ''}`}>
          <div className="w-12 h-12 bg-muted rounded-md shrink-0 overflow-hidden">
            {currentSong.artwork ? (
              <img
                src={`http://localhost:5000${currentSong.artwork}`}
                alt={`${currentSong.name} artwork`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder.svg';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h4 className="font-medium truncate">{currentSong.name}</h4>
            <p className="text-sm text-muted-foreground truncate">{currentSong.artist}</p>
          </div>
        </div>
        
        <div className={`flex flex-col items-center gap-2 ${isMobile ? 'w-full' : ''}`}>
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="shrink-0"
              onClick={handlePrevious}
            >
              <SkipBack className="h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-10 w-10 shrink-0"
              onClick={handlePlayPause}
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
              onClick={handleNext}
            >
              <SkipForward className="h-5 w-5" />
            </Button>
          </div>
          <div className={`flex items-center gap-2 ${isMobile ? 'w-full' : 'w-96'}`}>
            <span className="text-sm text-muted-foreground shrink-0">{formatTime(progress)}</span>
            <Slider
              value={[progress]}
              onValueChange={handleSeek}
              max={duration}
              step={1}
              className="w-full"
            />
            <span className="text-sm text-muted-foreground shrink-0">{formatTime(duration)}</span>
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