import { useEffect, useRef } from "react";
import { usePlayerStore } from "@/store/playerStore";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Music,
  X 
} from "lucide-react";
import { formatDuration } from "@/lib/utils";

export function Player() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const {
    currentSong,
    isPlaying,
    volume,
    currentTime,
    duration,
    setIsPlaying,
    setCurrentTime,
    setDuration,
    setVolume,
    nextSong,
    previousSong,
    setShowPlayer
  } = usePlayerStore();

  useEffect(() => {
    if (currentSong && audioRef.current) {
      const audioPath = `http://localhost:5000/${currentSong.filePath}`;
      audioRef.current.src = audioPath;
      audioRef.current.play().catch(console.error);
      setIsPlaying(true);
    }
  }, [currentSong, setIsPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => nextSong();

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [setCurrentTime, setDuration, nextSong]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    if (!audioRef.current) return;
    const newVolume = value[0];
    audioRef.current.volume = newVolume;
    setVolume(newVolume);
  };

  if (!currentSong) return null;

  return (
    <div className="flex-1 flex items-center gap-4">
      <audio ref={audioRef} />
      
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center overflow-hidden">
          {currentSong.artwork ? (
            <img
              src={`http://localhost:5000${currentSong.artwork}`}
              alt={currentSong.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Music className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0">
          <p className="font-medium truncate">{currentSong.name}</p>
          <p className="text-sm text-muted-foreground truncate">
            {currentSong.artist}
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center gap-1">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={previousSong}
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={togglePlay}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={nextSong}
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-full flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-12 text-right">
            {formatDuration(currentTime)}
          </span>
          <Slider
            value={[currentTime]}
            max={duration}
            step={1}
            onValueChange={handleSeek}
            className="w-[200px]"
          />
          <span className="text-xs text-muted-foreground w-12">
            {formatDuration(duration)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setVolume(volume === 0 ? 1 : 0)}
        >
          {volume === 0 ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </Button>
        <Slider
          value={[volume]}
          max={1}
          step={0.1}
          onValueChange={handleVolumeChange}
          className="w-24"
        />
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowPlayer(false)}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}