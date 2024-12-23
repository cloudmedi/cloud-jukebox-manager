import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRange } from "react-day-picker";
import { DateTimeRangePicker } from "@/components/reports/device-playback/DateTimeRangePicker";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface SongFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedGenre: string;
  onGenreChange: (value: string) => void;
  genres: string[];
  onDateRangeChange: (range: DateRange | undefined) => void;
  dateRange: DateRange | undefined;
  onDurationRangeChange: (range: [number, number]) => void;
  durationRange: [number, number];
  onLanguageChange: (value: string) => void;
  selectedLanguage: string;
  languages: string[];
  onAlbumChange: (value: string) => void;
  selectedAlbum: string;
  albums: string[];
}

export const SongFilters = ({
  searchTerm,
  onSearchChange,
  selectedGenre,
  onGenreChange,
  genres,
  onDateRangeChange,
  dateRange,
  onDurationRangeChange,
  durationRange,
  onLanguageChange,
  selectedLanguage,
  languages,
  onAlbumChange,
  selectedAlbum,
  albums,
}: SongFiltersProps) => {
  const [timeRange, setTimeRange] = useState({
    startTime: "00:00",
    endTime: "23:59",
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Şarkı veya sanatçı ara..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <Select value={selectedGenre} onValueChange={onGenreChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tür seçin" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            {genres.map((genre) => (
              <SelectItem key={genre} value={genre}>
                {genre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Label>Eklenme Tarihi</Label>
          <DateTimeRangePicker
            dateRange={dateRange}
            timeRange={timeRange}
            onDateRangeChange={onDateRangeChange}
            onTimeRangeChange={(type, value) =>
              setTimeRange((prev) => ({ ...prev, [type]: value }))
            }
          />
        </div>

        <div>
          <Label>Şarkı Süresi (dakika)</Label>
          <Slider
            defaultValue={durationRange}
            max={10}
            step={0.5}
            onValueChange={onDurationRangeChange}
            className="mt-2"
          />
          <div className="flex justify-between mt-1 text-sm text-muted-foreground">
            <span>{durationRange[0]} dk</span>
            <span>{durationRange[1]} dk</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={selectedLanguage} onValueChange={onLanguageChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Dil seçin" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            {languages.map((language) => (
              <SelectItem key={language} value={language}>
                {language}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedAlbum} onValueChange={onAlbumChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Albüm seçin" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            {albums.map((album) => (
              <SelectItem key={album} value={album}>
                {album}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};