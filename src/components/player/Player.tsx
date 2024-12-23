import { usePlaybackStore } from "@/store/playbackStore";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";
import { Song } from "@/types/song";

export const Player = () => {
  const { 
    currentSong,
    isPlaying,
    volume,
    currentTime,
    duration,
    togglePlayPause,
    setVolume,
    setCurrentTime,
    playPreviousSong,
    playNextSong
  } = usePlaybackStore();

  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(volume);

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    if (value[0] > 0) setIsMuted(false);
  };

  const toggleMute = () => {
    if (isMuted) {
      setVolume(previousVolume);
      setIsMuted(false);
    } else {
      setPreviousVolume(volume);
      setVolume(0);
      setIsMuted(true);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!currentSong) return null;

  return (
    <div className="player fixed bottom-0 left-0 right-0 bg-background border-t p-4">
      <div className="container max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {currentSong.artwork && (
              <img
                src={`http://localhost:5000${currentSong.artwork}`}
                alt={currentSong.name}
                className="w-12 h-12 rounded object-cover"
              />
            )}
            <div className="min-w-0">
              <div className="font-medium truncate">{currentSong.name}</div>
              <div className="text-sm text-muted-foreground truncate">
                {currentSong.artist}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={playPreviousSong}
              >
                <SkipBack className="h-5 w-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={togglePlayPause}
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
                onClick={playNextSong}
              >
                <SkipForward className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex items-center gap-2 w-full max-w-md">
              <span className="text-sm tabular-nums">
                {formatTime(currentTime)}
              </span>
              <Slider
                value={[currentTime]}
                min={0}
                max={duration}
                step={1}
                onValueChange={(value) => setCurrentTime(value[0])}
                className="flex-1"
              />
              <span className="text-sm tabular-nums">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-1 justify-end">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
            >
              {volume === 0 || isMuted ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </Button>
            <Slider
              value={[volume]}
              min={0}
              max={1}
              step={0.01}
              onValueChange={handleVolumeChange}
              className="w-32"
            />
          </div>
        </div>
      </div>
    </div>
  );
};