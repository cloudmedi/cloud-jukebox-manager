import { useState, useEffect, useRef } from "react";
import { Music, X, PlaySquare } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePlayerStore } from "@/store/playerStore";
import { Button } from "@/components/ui/button";
import PlayerControls from "./PlayerControls";
import VolumeControl from "./VolumeControl";
import ProgressBar from "./ProgressBar";

const Player = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showTime, setShowTime] = useState(true);
  const audioRef = useRef(null);
  const isMobile = useIsMobile();
  
  const { currentSong, currentPlaylist, queue, setCurrentSong, setQueue } = usePlayerStore();

  useEffect(() => {
    if (currentSong && audioRef.current) {
      const audioPath = currentSong.localPath || (currentSong.filePath ? `http://localhost:5000/${currentSong.filePath}` : '');
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

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    if (queue.length > 0) {
      // Play next song in queue
      const nextSong = queue[0];
      const newQueue = queue.slice(1);
      setCurrentSong(nextSong);
      setQueue(newQueue);
    } else {
      setIsPlaying(false);
    }
  };

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
    if (queue.length > 0) {
      const nextSong = queue[0];
      const newQueue = queue.slice(1);
      setCurrentSong(nextSong);
      setQueue(newQueue);
    }
  };

  const handlePrevious = () => {
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
    } else {
      // Previous song logic could be implemented here
    }
  };

  const handleVolumeChange = (value) => {
    if (audioRef.current) {
      const newVolume = value / 100;
      audioRef.current.volume = newVolume;
      setVolume(value);
      if (value > 0) {
        setIsMuted(false);
      }
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      const newMutedState = !isMuted;
      audioRef.current.muted = newMutedState;
      setIsMuted(newMutedState);
    }
  };

  const handleSeek = (value) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setProgress(value[0]);
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleClose = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setCurrentSong(null);
    setQueue([]);
    setIsPlaying(false);
  };

  if (!currentSong) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-24 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border/40 z-50">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />
      <div className={`mx-auto h-full flex items-center ${isMobile ? 'px-2 flex-col justify-center gap-2 h-auto py-4' : 'container px-4 justify-between'}`}>
        {/* Sol kısım: Şarkı bilgileri */}
        <div className={`flex items-center gap-4 ${isMobile ? 'w-full justify-between' : 'min-w-[240px]'}`}>
          <div className="group relative w-16 h-16 bg-muted rounded-md shrink-0 overflow-hidden">
            {(currentPlaylist?.artwork || currentSong?.artwork) ? (
              <>
                <img
                  src={`http://localhost:5000${currentPlaylist?.artwork || currentSong?.artwork}`}
                  alt={currentPlaylist?.name || currentSong?.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    e.target.src = '/placeholder.svg';
                  }}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300" />
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex flex-col">
            <h4 className="text-base font-semibold truncate hover:text-primary transition-colors">{currentSong?.name}</h4>
            <p className="text-sm text-muted-foreground/80 truncate hover:text-muted-foreground transition-colors">{currentSong?.artist}</p>
            {currentPlaylist && (
              <p className="text-xs font-medium text-primary/70 truncate mt-0.5 hover:text-primary transition-colors">
                {currentPlaylist.name}
              </p>
            )}
          </div>
        </div>
        
        {/* Orta kısım: Kontroller ve progress */}
        <div className={`flex flex-col items-center ${isMobile ? 'w-full' : 'flex-1 max-w-2xl px-12'}`}>
          <div className="flex items-center justify-center gap-6 mb-1.5">
            <PlayerControls
              isPlaying={isPlaying}
              onPlayPause={handlePlayPause}
              onNext={handleNext}
              onPrevious={handlePrevious}
            />
          </div>
          <div className="w-full flex items-center gap-3">
            {showTime && (
              <>
                <span className="text-sm font-medium text-muted-foreground/80 min-w-[45px] text-right select-none">
                  {formatTime(progress)}
                </span>
                <div className="flex-1">
                  <ProgressBar
                    progress={progress}
                    duration={duration}
                    onSeek={handleSeek}
                  />
                </div>
                <span className="text-sm font-medium text-muted-foreground/80 min-w-[45px] select-none">
                  {formatTime(duration)}
                </span>
              </>
            )}
          </div>
        </div>
        
        {/* Sağ kısım: Ses kontrolü ve Kapat butonu */}
        <div className={`flex items-center gap-4 ${isMobile ? 'w-full justify-end' : 'min-w-[240px] justify-end'}`}>
          <VolumeControl
            volume={volume}
            isMuted={isMuted}
            onVolumeChange={handleVolumeChange}
            onToggleMute={toggleMute}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-9 w-9 hover:bg-destructive/10 hover:text-destructive transition-all ml-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Player;