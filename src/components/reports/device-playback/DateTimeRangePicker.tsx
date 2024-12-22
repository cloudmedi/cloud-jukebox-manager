import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePickerWithRange } from "@/components/ui/date-picker";
import { DateRange } from "react-day-picker";

interface DateTimeRangePickerProps {
  dateRange: DateRange;
  timeRange: {
    startTime: string;
    endTime: string;
  };
  onDateRangeChange: (range: DateRange) => void;
  onTimeRangeChange: (type: "startTime" | "endTime", value: string) => void;
  showDownloadButton?: boolean;
  isDownloadDisabled?: boolean;
  onDownload?: () => void;
}

export function DateTimeRangePicker({
  dateRange,
  timeRange,
  onDateRangeChange,
  onTimeRangeChange,
  showDownloadButton,
  isDownloadDisabled,
  onDownload,
}: DateTimeRangePickerProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <DatePickerWithRange date={dateRange} setDate={onDateRangeChange} />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Başlangıç Saati</label>
          <Input
            type="time"
            value={timeRange.startTime}
            onChange={(e) => onTimeRangeChange("startTime", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Bitiş Saati</label>
          <Input
            type="time"
            value={timeRange.endTime}
            onChange={(e) => onTimeRangeChange("endTime", e.target.value)}
          />
        </div>
      </div>

      {showDownloadButton && (
        <Button
          onClick={onDownload}
          disabled={isDownloadDisabled}
          className="w-full md:w-auto"
        >
          <Download className="mr-2 h-4 w-4" />
          PDF İndir
        </Button>
      )}
    </div>
  );
}