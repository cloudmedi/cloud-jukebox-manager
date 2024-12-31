import { useState, useRef, useEffect } from "react";
import { Music, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { audioPlayerService } from "@/services/audioPlayerService";
import { formatDuration } from "@/lib/utils";

const Player = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentSong, setCurrentSong] = useState<any>(null);

  useEffect(() => {
    const audio = audioPlayerService['audio'];
    
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    
    const handleSongChange = () => {
      const song = audioPlayerService.getCurrentSong();
      setCurrentSong(song);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    
    handleSongChange();

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const handlePlayPause = async () => {
    try {
      if (isPlaying) {
        audioPlayerService.pause();
      } else {
        await audioPlayerService.play();
      }
    } catch (error) {
      console.error('Playback error:', error);
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioPlayerService['audio']) {
      audioPlayerService['audio'].currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    audioPlayerService.setVolume(newVolume);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (isMuted) {
      handleVolumeChange([volume]);
    } else {
      handleVolumeChange([0]);
    }
    setIsMuted(!isMuted);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t">
      <div className="container flex items-center gap-4 py-3">
        <div className="flex items-center gap-3 flex-1">
          {currentSong && (
            <>
              <div className="relative w-12 h-12 bg-muted rounded-md flex items-center justify-center overflow-hidden">
                {currentSong.artwork ? (
                  <img
                    src={currentSong.artwork}
                    alt={currentSong.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Music className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="font-medium">{currentSong.name}</p>
                <p className="text-sm text-muted-foreground">
                  {currentSong.artist}
                </p>
              </div>
            </>
          )}
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => audioPlayerService.playPrevious()}
            >
              <SkipBack className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10"
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
              onClick={() => audioPlayerService.playNext()}
            >
              <SkipForward className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-10 text-right">
              {formatDuration(currentTime)}
            </span>
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={1}
              onValueChange={handleSeek}
              className="w-[400px]"
            />
            <span className="text-xs text-muted-foreground w-10">
              {formatDuration(duration)}
            </span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-end gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={toggleMute}
          >
            {isMuted ? (
              <VolumeX className="h-5 w-5" />
            ) : (
              <Volume2 className="h-5 w-5" />
            )}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            max={1}
            step={0.1}
            onValueChange={handleVolumeChange}
            className="w-[100px]"
          />
        </div>
      </div>
    </div>
  );
};

export default Player;