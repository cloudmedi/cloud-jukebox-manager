import { Button } from "@/components/ui/button";
import { DatePickerWithRange } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Download } from "lucide-react";

interface DateTimeRangePickerProps {
  dateRange: { from: Date; to: Date };
  timeRange: { startTime: string; endTime: string };
  onDateRangeChange: (range: { from: Date; to: Date }) => void;
  onTimeRangeChange: (type: 'startTime' | 'endTime', value: string) => void;
  showDownloadButton?: boolean;
  isDownloadDisabled?: boolean;
  onDownload?: () => void;
}

export const DateTimeRangePicker = ({
  dateRange,
  timeRange,
  onDateRangeChange,
  onTimeRangeChange,
  showDownloadButton,
  isDownloadDisabled,
  onDownload
}: DateTimeRangePickerProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <DatePickerWithRange
        date={dateRange}
        setDate={onDateRangeChange}
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Başlangıç Saati</label>
          <Input
            type="time"
            value={timeRange.startTime}
            onChange={(e) => onTimeRangeChange('startTime', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Bitiş Saati</label>
          <Input
            type="time"
            value={timeRange.endTime}
            onChange={(e) => onTimeRangeChange('endTime', e.target.value)}
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
};