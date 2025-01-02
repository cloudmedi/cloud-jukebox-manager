import { Button } from "@/components/ui/button";
import { Calendar, List } from "lucide-react";

interface ScheduleHeaderProps {
  view: "timeGridWeek" | "dayGridMonth";
  setView: (view: "timeGridWeek" | "dayGridMonth") => void;
}

export const ScheduleHeader = ({ view, setView }: ScheduleHeaderProps) => {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-lg shadow-sm">
      <h2 className="text-3xl font-bold tracking-tight">
        Zamanlama
      </h2>
      <div className="flex items-center gap-2">
        <Button
          variant={view === "timeGridWeek" ? "default" : "outline"}
          size="sm"
          onClick={() => setView("timeGridWeek")}
          className="flex-1 sm:flex-none"
        >
          <List className="h-4 w-4 mr-2" />
          Haftalık
        </Button>
        <Button
          variant={view === "dayGridMonth" ? "default" : "outline"}
          size="sm"
          onClick={() => setView("dayGridMonth")}
          className="flex-1 sm:flex-none"
        >
          <Calendar className="h-4 w-4 mr-2" />
          Aylık
        </Button>
      </div>
    </div>
  );
};