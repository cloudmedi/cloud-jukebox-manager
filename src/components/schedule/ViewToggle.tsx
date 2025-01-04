import { Button } from "@/components/ui/button";
import { Calendar, List } from "lucide-react";

interface ViewToggleProps {
  view: "timeGridWeek" | "dayGridMonth";
  onViewChange: (view: "timeGridWeek" | "dayGridMonth") => void;
}

export const ViewToggle = ({ view, onViewChange }: ViewToggleProps) => {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant={view === "timeGridWeek" ? "default" : "outline"}
        size="sm"
        onClick={() => onViewChange("timeGridWeek")}
      >
        <List className="h-4 w-4 mr-2" />
        Haftalık
      </Button>
      <Button
        variant={view === "dayGridMonth" ? "default" : "outline"}
        size="sm"
        onClick={() => onViewChange("dayGridMonth")}
      >
        <Calendar className="h-4 w-4 mr-2" />
        Aylık
      </Button>
    </div>
  );
};