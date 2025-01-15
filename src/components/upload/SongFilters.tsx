import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRange } from "react-day-picker";
import { UploadDateRangeSelect } from "@/components/upload/UploadDateRangeSelect";
import { TimeFilter, timeFilterOptions } from "@/types/timeFilter";

interface SongFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedGenre: string;
  onGenreChange: (value: string) => void;
  genres: string[];
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  timeFilter: TimeFilter;
  onTimeFilterChange: (filter: TimeFilter) => void;
}

export function SongFilters({
  searchTerm,
  onSearchChange,
  selectedGenre,
  onGenreChange,
  genres,
  dateRange,
  onDateRangeChange,
  timeFilter,
  onTimeFilterChange
}: SongFiltersProps) {
  return (
    <div className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
      <div className="flex-1">
        <Input
          placeholder="Şarkı veya sanatçı ara..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full"
        />
      </div>
      <Select value={selectedGenre} onValueChange={onGenreChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Tür seçin" />
        </SelectTrigger>
        <SelectContent>
          {genres.map((genre) => (
            <SelectItem key={genre} value={genre}>
              {genre === "all" ? "Tüm Türler" : genre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={timeFilter} onValueChange={onTimeFilterChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Zaman filtresi" />
        </SelectTrigger>
        <SelectContent>
          {timeFilterOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <UploadDateRangeSelect 
        dateRange={dateRange} 
        onDateRangeChange={onDateRangeChange}
      />
    </div>
  );
}