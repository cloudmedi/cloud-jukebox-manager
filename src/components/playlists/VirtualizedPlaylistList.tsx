import { memo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { PlaylistCard } from './PlaylistCard';
import { useWindowSize } from '@/hooks/use-window-size';

interface VirtualizedPlaylistListProps {
  playlists: any[];
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onPlay: (id: string) => void;
}

const PLAYLIST_CARD_HEIGHT = 200; // Approximate height of each card
const ITEMS_PER_ROW = 3; // Number of cards per row

export const VirtualizedPlaylistList = memo(({ 
  playlists, 
  onDelete, 
  onEdit, 
  onPlay 
}: VirtualizedPlaylistListProps) => {
  const { width } = useWindowSize();
  const itemCount = Math.ceil(playlists.length / ITEMS_PER_ROW);

  const Row = memo(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const startIndex = index * ITEMS_PER_ROW;
    const rowPlaylists = playlists.slice(startIndex, startIndex + ITEMS_PER_ROW);

    return (
      <div style={style} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rowPlaylists.map((playlist) => (
          <PlaylistCard
            key={playlist._id}
            playlist={playlist}
            onDelete={onDelete}
            onEdit={onEdit}
            onPlay={onPlay}
          />
        ))}
      </div>
    );
  });
  Row.displayName = 'PlaylistRow';

  return (
    <List
      height={800} // Fixed height for the virtualized area
      itemCount={itemCount}
      itemSize={PLAYLIST_CARD_HEIGHT}
      width={width}
      className="scrollbar-hide"
    >
      {Row}
    </List>
  );
});

VirtualizedPlaylistList.displayName = 'VirtualizedPlaylistList';