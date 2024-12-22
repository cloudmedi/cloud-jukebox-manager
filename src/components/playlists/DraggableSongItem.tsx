import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Play, GripVertical, Trash2 } from "lucide-react";
import { formatDuration } from "@/lib/utils";
import { Song } from "@/types/song";

interface DraggableSongItemProps {
  song: Song;
  onRemove: (songId: string) => void;
}

export const DraggableSongItem = ({ song, onRemove }: DraggableSongItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: song._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between rounded-lg border p-2 hover:bg-accent group"
    >
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="cursor-grab"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </Button>
        <Button variant="ghost" size="icon">
          <Play className="h-4 w-4" />
        </Button>
        <div>
          <p className="font-medium">{song.name}</p>
          <p className="text-sm text-muted-foreground">{song.artist}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">
          {formatDuration(song.duration)}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(song._id)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
};