import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LocationFilterProps {
  locations: string[];
  value: string;
  onChange: (location: string) => void;
}

export const LocationFilter = ({ locations, value, onChange }: LocationFilterProps) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px] h-9">
        <SelectValue placeholder="Lokasyon" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="_all">Tüm Lokasyonlar</SelectItem>
        {locations.map((location) => (
          <SelectItem key={location} value={location}>
            {location}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};