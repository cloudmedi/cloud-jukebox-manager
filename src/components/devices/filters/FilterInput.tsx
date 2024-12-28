import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

interface FilterInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

export const FilterInput = ({ value, onChange, placeholder }: FilterInputProps) => {
  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 pr-4 h-11"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 hover:bg-gray-100 rounded-full flex items-center justify-center"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};