import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface FilterActionsProps {
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export const FilterActions = ({ hasActiveFilters, onClearFilters }: FilterActionsProps) => {
  if (!hasActiveFilters) return null;

  return (
    <Button variant="ghost" size="sm" onClick={onClearFilters} className="h-9">
      <X className="h-4 w-4 mr-2" />
      Filtreleri Temizle
    </Button>
  );
};