import { useEffect, useRef, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { usePlaybackStore } from "@/store/playbackStore";
import { Song } from "@/types/song";
import { formatDuration } from "@/lib/utils";

export const Player = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  
  const { currentSong, queue, setCurrentSong } = usePlaybackStore();

  useEffect(() => {
    if (currentSong && audioRef.current) {
      audioRef.current.src = `http://localhost:5000/${currentSong.filePath}`;
      audioRef.current.play().catch(console.error);
    }
  }, [currentSong]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);
    }
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(console.error);
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    if (newVolume === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      const newMutedState = !isMuted;
      setIsMuted(newMutedState);
      audioRef.current.volume = newMutedState ? 0 : volume;
    }
  };

  const handleNext = () => {
    if (queue.length > 0) {
      const currentIndex = queue.findIndex(song => song._id === currentSong?._id);
      const nextSong = queue[(currentIndex + 1) % queue.length];
      setCurrentSong(nextSong);
    }
  };

  const handlePrevious = () => {
    if (queue.length > 0) {
      const currentIndex = queue.findIndex(song => song._id === currentSong?._id);
      const prevSong = queue[(currentIndex - 1 + queue.length) % queue.length];
      setCurrentSong(prevSong);
    }
  };

  if (!currentSong) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t">
      <div className="container flex items-center justify-between h-20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-muted rounded-md overflow-hidden">
            {currentSong.artwork ? (
              <img
                src={`http://localhost:5000${currentSong.artwork}`}
                alt={currentSong.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <span className="text-2xl">🎵</span>
              </div>
            )}
          </div>
          <div>
            <h3 className="font-medium">{currentSong.name}</h3>
            <p className="text-sm text-muted-foreground">{currentSong.artist}</p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 flex-1 max-w-xl">
          <div className="flex items-center gap-4">
            <button
              onClick={handlePrevious}
              className="p-2 hover:bg-accent rounded-full"
            >
              <SkipBack className="h-5 w-5" />
            </button>
            <button
              onClick={handlePlayPause}
              className="p-3 hover:bg-accent rounded-full"
            >
              {isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6" />
              )}
            </button>
            <button
              onClick={handleNext}
              className="p-2 hover:bg-accent rounded-full"
            >
              <SkipForward className="h-5 w-5" />
            </button>
          </div>
          <div className="w-full flex items-center gap-2 text-sm">
            <span className="w-12 text-right">{formatDuration(currentTime)}</span>
            <Slider
              value={[currentTime]}
              max={duration}
              step={1}
              onValueChange={(value) => {
                if (audioRef.current) {
                  audioRef.current.currentTime = value[0];
                }
              }}
              className="flex-1"
            />
            <span className="w-12">{formatDuration(duration)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-36">
          <button onClick={toggleMute} className="p-2 hover:bg-accent rounded-full">
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
            className="flex-1"
          />
        </div>

        <audio
          ref={audioRef}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleNext}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      </div>
    </div>
  );
};

export default Player;