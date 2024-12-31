import { useState, useRef, useEffect } from "react";
import { Music, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { formatDuration } from "@/lib/utils";
import { usePlayerStore } from "@/store/playerStore";

const Player = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const { currentSong, nextSong, previousSong } = usePlayerStore();

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    if (currentSong && audioRef.current) {
      audioRef.current.src = `http://localhost:5000/${currentSong.filePath}`;
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [currentSong]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    if (audioRef.current) {
      const newVolume = value[0];
      audioRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      const newMutedState = !isMuted;
      audioRef.current.volume = newMutedState ? 0 : volume;
      setIsMuted(newMutedState);
    }
  };

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
    // Main process'e playback durumunun değiştiğini bildir
    window.electron.ipcRenderer.send('playback-toggled', !isPlaying);
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
                    src={`http://localhost:5000${currentSong.artwork}`}
                    alt={`${currentSong.name} artwork`}
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
            <button onClick={previousSong}>
              <SkipBack className="h-5 w-5" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="rounded-full p-2 hover:bg-muted"
            >
              {isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6" />
              )}
            </button>
            <button onClick={nextSong}>
              <SkipForward className="h-5 w-5" />
            </button>
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
          <button onClick={toggleMute}>
            {isMuted ? (
              <VolumeX className="h-5 w-5" />
            ) : (
              <Volume2 className="h-5 w-5" />
            )}
          </button>
          <Slider
            value={[isMuted ? 0 : volume]}
            max={1}
            step={0.1}
            onValueChange={handleVolumeChange}
            className="w-[100px]"
          />
        </div>
      </div>
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={nextSong}
      />
    </div>
  );
};

export default Player;
