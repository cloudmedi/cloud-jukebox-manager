import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { DraggableSongItem } from "./DraggableSongItem";
import { Song } from "@/types/song";

interface SongListProps {
  songs: Song[];
  onRemove: (songId: string) => void;
  onReorder?: (songs: Song[]) => void;
  isLoading?: boolean;
}

export const SongList = ({ songs, onRemove, onReorder, isLoading }: SongListProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = songs.findIndex((song) => song._id === active.id);
      const newIndex = songs.findIndex((song) => song._id === over.id);

      const newSongs = [...songs];
      const [movedSong] = newSongs.splice(oldIndex, 1);
      newSongs.splice(newIndex, 0, movedSong);

      onReorder?.(newSongs);
    }
  };

  if (songs.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Bu playlist'te henüz şarkı yok
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={songs.map(song => song._id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-1 p-4">
          {songs.map((song) => (
            <DraggableSongItem
              key={song._id}
              song={song}
              onRemove={onRemove}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};