import { useEffect, useRef, useState } from "react";
import { Howl } from "howler";
import { usePlaybackStore } from "@/store/playbackStore";
import { Music } from "lucide-react";

export const Player = () => {
  const { currentSong, isPlaying, setIsPlaying, queue, setQueue } = usePlaybackStore();
  const [sound, setSound] = useState<Howl | null>(null);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [duration, setDuration] = useState(0);
  const progressInterval = useRef<number>();

  useEffect(() => {
    if (sound) {
      sound.volume(volume);
    }
  }, [sound, volume]);

  useEffect(() => {
    if (currentSong) {
      const newSound = new Howl({
        src: [currentSong.filePath],
        html5: true,
        onload: () => {
          setDuration(newSound.duration());
        },
        onplay: () => {
          setIsPlaying(true);
          progressInterval.current = window.setInterval(() => {
            setProgress(newSound.seek());
          }, 1000);
        },
        onpause: () => {
          setIsPlaying(false);
          if (progressInterval.current) {
            clearInterval(progressInterval.current);
          }
        },
        onend: () => {
          setIsPlaying(false);
          if (progressInterval.current) {
            clearInterval(progressInterval.current);
          }
          // Logic to play next song in queue
        },
      });

      setSound(newSound);
      newSound.play();

      return () => {
        newSound.stop();
        setSound(null);
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
        }
      };
    }
  }, [currentSong]);

  const artworkUrl = currentSong?.artwork 
    ? `http://localhost:5000${currentSong.artwork}`
    : '/placeholder.svg';

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t">
      <div className="container flex items-center justify-between h-20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center overflow-hidden">
            {currentSong?.artwork ? (
              <img 
                src={artworkUrl}
                alt={currentSong.name} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <Music className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="font-medium">{currentSong?.name}</p>
            <p className="text-sm text-muted-foreground">{currentSong?.artist}</p>
          </div>
        </div>
        <div className="flex items-center">
          <button onClick={() => setIsPlaying(!isPlaying)}>
            {isPlaying ? "Pause" : "Play"}
          </button>
          <div className="flex items-center">
            <span>{formatDuration(progress)}</span> / <span>{formatDuration(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
