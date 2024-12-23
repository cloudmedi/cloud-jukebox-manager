import {
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

interface SongTableHeaderProps {
  showCheckbox?: boolean;
  allSongs?: any[];
  sortConfig?: {
    key: string;
    direction: string;
  };
  onSort?: (key: string) => void;
  onSelectAll?: (checked: boolean) => void;
  selectedCount?: number;
}

export const SongTableHeader = ({ 
  showCheckbox = false, 
  allSongs = [],
  sortConfig,
  onSort,
  onSelectAll,
  selectedCount = 0
}: SongTableHeaderProps) => {
  const isAllSelected = allSongs.length > 0 && selectedCount === allSongs.length;
  const isPartiallySelected = selectedCount > 0 && selectedCount < allSongs.length;

  return (
    <TableHeader>
      <TableRow>
        {showCheckbox && (
          <TableHead className="w-[50px]">
            <Checkbox
              checked={isAllSelected}
              onCheckedChange={onSelectAll}
              aria-label="Tümünü seç"
              className="ml-2"
              ref={(input) => {
                if (input) {
                  input.indeterminate = isPartiallySelected;
                }
              }}
            />
          </TableHead>
        )}
        <TableHead onClick={() => onSort?.('name')} className="cursor-pointer">Şarkı</TableHead>
        <TableHead onClick={() => onSort?.('artist')} className="cursor-pointer">Sanatçı</TableHead>
        <TableHead onClick={() => onSort?.('genre')} className="cursor-pointer">Tür</TableHead>
        <TableHead onClick={() => onSort?.('album')} className="cursor-pointer">Albüm</TableHead>
        <TableHead onClick={() => onSort?.('duration')} className="cursor-pointer">Süre</TableHead>
        <TableHead onClick={() => onSort?.('createdAt')} className="cursor-pointer">Eklenme Tarihi</TableHead>
        <TableHead className="w-[70px]"></TableHead>
      </TableRow>
    </TableHeader>
  );
};