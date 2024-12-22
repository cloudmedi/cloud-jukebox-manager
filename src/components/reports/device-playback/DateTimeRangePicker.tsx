import { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Download } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface DateTimeRangePickerProps {
  dateRange: { from: Date; to: Date };
  timeRange: {
    startTime: string;
    endTime: string;
  };
  onDateRangeChange: (range: { from: Date; to: Date }) => void;
  onTimeRangeChange: (type: "startTime" | "endTime", value: string) => void;
  onDownload?: () => void;
  showDownloadButton?: boolean;
  isDownloadDisabled?: boolean;
}

export function DateTimeRangePicker({
  dateRange,
  timeRange,
  onDateRangeChange,
  onTimeRangeChange,
  onDownload,
  showDownloadButton = false,
  isDownloadDisabled = false,
}: DateTimeRangePickerProps) {
  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (range?.from) {
      onDateRangeChange({
        from: range.from,
        to: range.to ?? range.from,
      });
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="flex flex-col space-y-2">
        <label className="text-sm font-medium">Tarih Aralığı</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !dateRange && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "dd.MM.yyyy")} -{" "}
                    {format(dateRange.to, "dd.MM.yyyy")}
                  </>
                ) : (
                  format(dateRange.from, "dd.MM.yyyy")
                )
              ) : (
                <span>Tarih aralığı seçin</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={{
                from: dateRange.from,
                to: dateRange.to
              }}
              onSelect={handleDateRangeChange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium">Başlangıç Saati</label>
          <Input
            type="time"
            value={timeRange.startTime}
            onChange={(e) => onTimeRangeChange("startTime", e.target.value)}
          />
        </div>
        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium">Bitiş Saati</label>
          <Input
            type="time"
            value={timeRange.endTime}
            onChange={(e) => onTimeRangeChange("endTime", e.target.value)}
          />
        </div>
        {showDownloadButton && (
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium">&nbsp;</label>
            <Button
              onClick={onDownload}
              disabled={isDownloadDisabled}
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              PDF İndir
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}