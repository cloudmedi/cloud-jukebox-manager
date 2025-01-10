import { useState, memo } from "react";
import { Music2, Clock, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/utils";
import { SendPlaylistDialog } from "./SendPlaylistDialog";
import { usePlayerStore } from "@/store/playerStore";
import { usePlayer } from "@/components/layout/MainLayout";

const ARTWORK_SIZES = {
  CARD: {
    width: 220,
    height: 220,
  },
};

interface PlaylistCardProps {
  playlist: {
    _id: string;
    name: string;
    description?: string;
    songs: any[];
    totalDuration?: number;
    artwork?: string;
    genre?: string;
  };
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
  onPlay?: (id: string) => void;
}

const PlaylistCard = memo(({ playlist, onDelete, onEdit, onPlay }: PlaylistCardProps) => {
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const { setShowPlayer } = usePlayer();

  const handlePlay = () => {
    if (playlist.songs && playlist.songs.length > 0) {
      usePlayerStore.getState().playPlaylist(playlist);
      setShowPlayer(true);
    }
  };

  return (
    <>
      <div className={`group relative rounded-lg overflow-hidden bg-card w-[${ARTWORK_SIZES.CARD.width}px]`}>
        <div className="relative group">
          <div className="relative aspect-square rounded-md overflow-hidden bg-muted">
            {playlist.artwork ? (
              <>
                <img
                  src={`http://localhost:5000${playlist.artwork}`}
                  alt={playlist.name}
                  className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 group-hover:[&:not(:has(button:hover))]:bg-black/40 transition-colors duration-500" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <button 
                    onClick={handlePlay}
                    className="w-12 h-12 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center transform scale-75 group-hover:[&:not(:has(button:hover))]:scale-100 transition-all duration-500 ease-out hover:bg-primary hover:scale-105"
                  >
                    <Play className="w-6 h-6" />
                  </button>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <Music2 className="h-12 w-12 text-muted-foreground/40" />
              </div>
            )}
            
            <div className="absolute bottom-0 left-0 right-0">
              <div className="bg-black/40 backdrop-blur-[2px] p-2.5 transition-colors duration-500">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-1">
                    <h3 className="font-medium text-[14px] text-white/95 group-hover:text-white transition-colors duration-300 line-clamp-2">
                      {playlist.name}
                    </h3>
                    <div className="flex items-center justify-between gap-3 text-[11px] text-white/75 group-hover:text-white/90">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 min-w-[2.5rem]">
                          <Music2 className="h-3 w-3 shrink-0" />
                          <span className="tabular-nums">
                            {playlist.songs?.length || 0}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 min-w-[3.5rem]">
                          <Clock className="h-3 w-3 shrink-0" />
                          <span className="tabular-nums">
                            {formatDuration(playlist.totalDuration || 0)}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        className="relative z-10 h-[18px] px-2 rounded-sm bg-black/50 hover:bg-black/70 text-[11px] font-normal text-white/80 hover:text-white transition-all duration-300 -mr-0.5"
                        onClick={() => setIsSendDialogOpen(true)}
                      >
                        Gönder
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SendPlaylistDialog 
        isOpen={isSendDialogOpen}
        onClose={() => setIsSendDialogOpen(false)}
        playlist={playlist}
      />
    </>
  );
});

PlaylistCard.displayName = "PlaylistCard";

export default PlaylistCard;
