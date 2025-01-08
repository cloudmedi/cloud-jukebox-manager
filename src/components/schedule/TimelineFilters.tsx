import { useState } from "react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface TimelineFiltersProps {
  playlists: Array<{ 
    _id: string; 
    name: string;
    backgroundColor?: string;
    borderColor?: string;
    color?: string;
  }>;
  onFiltersChange: (filters: TimelineFilters) => void;
}

export interface TimelineFilters {
  search: string;
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
  selectedPlaylists: string[];
  showRecurring: boolean;
}

export function TimelineFilters({ playlists, onFiltersChange }: TimelineFiltersProps) {
  const [filters, setFilters] = useState<TimelineFilters>({
    search: "",
    dateRange: {
      from: undefined,
      to: undefined,
    },
    selectedPlaylists: [],
    showRecurring: true,
  });

  const updateFilters = (newFilters: Partial<TimelineFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const togglePlaylist = (playlistId: string) => {
    const newSelectedPlaylists = filters.selectedPlaylists.includes(playlistId)
      ? filters.selectedPlaylists.filter(id => id !== playlistId)
      : [...filters.selectedPlaylists, playlistId];
    updateFilters({ selectedPlaylists: newSelectedPlaylists });
  };

  return (
    <div className="space-y-3">
      {/* Üst Satır - Arama, Tarih ve Checkbox */}
      <div className="flex items-center gap-4">
        <Input
          type="search"
          placeholder="Event ara..."
          value={filters.search}
          onChange={(e) => updateFilters({ search: e.target.value })}
          className="flex-1"
        />

        <Input
          type="date"
          placeholder="gg.aa.yyyy"
          value={filters.dateRange.from ? format(filters.dateRange.from, "yyyy-MM-dd") : ""}
          onChange={(e) => {
            const date = e.target.value ? new Date(e.target.value) : undefined;
            updateFilters({ dateRange: { ...filters.dateRange, from: date } });
          }}
          className="w-[180px]"
        />

        <Input
          type="date"
          placeholder="gg.aa.yyyy"
          value={filters.dateRange.to ? format(filters.dateRange.to, "yyyy-MM-dd") : ""}
          onChange={(e) => {
            const date = e.target.value ? new Date(e.target.value) : undefined;
            updateFilters({ dateRange: { ...filters.dateRange, to: date } });
          }}
          className="w-[180px]"
        />

        <div className="flex items-center gap-2">
          <Checkbox
            id="recurring"
            checked={filters.showRecurring}
            onCheckedChange={(checked) =>
              updateFilters({ showRecurring: checked as boolean })
            }
          />
          <label
            htmlFor="recurring"
            className="text-sm font-medium leading-none cursor-pointer whitespace-nowrap"
          >
            Tekrarlanan eventler
          </label>
        </div>
      </div>

      {/* Alt Satır - Playlist'ler */}
      <div className="flex flex-wrap gap-2">
        {playlists.map((playlist) => {
          const isSelected = filters.selectedPlaylists.includes(playlist._id);
          return (
            <div
              key={playlist._id}
              className={cn(
                "px-3 py-1 rounded-full text-sm cursor-pointer transition-all font-medium text-black",
                isSelected ? "opacity-100" : "opacity-70 hover:opacity-100"
              )}
              style={{
                backgroundColor: playlist.backgroundColor
              }}
              onClick={() => togglePlaylist(playlist._id)}
            >
              {playlist.name}
            </div>
          );
        })}
      </div>
    </div>
  );
}
