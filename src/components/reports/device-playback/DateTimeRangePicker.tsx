import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Download, CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

interface DateTimeRangePickerProps {
  dateRange: DateRange | undefined;
  timeRange: {
    startTime: string;
    endTime: string;
  };
  onDateRangeChange: (range: DateRange | undefined) => void;
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
  const formatDateWithTime = (date: Date | undefined, time: string) => {
    if (!date) return "";
    return `${format(date, "dd MMM yyyy", { locale: tr })} ${time}`;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="grid gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !dateRange && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {formatDateWithTime(dateRange.from, timeRange.startTime)} -{" "}
                    {formatDateWithTime(dateRange.to, timeRange.endTime)}
                  </>
                ) : (
                  formatDateWithTime(dateRange.from, timeRange.startTime)
                )
              ) : (
                <span>Tarih ve saat aralığı seçin</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-4 border-b">
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm font-medium">Başlangıç Saati</label>
                    <input
                      type="time"
                      value={timeRange.startTime}
                      onChange={(e) => onTimeRangeChange("startTime", e.target.value)}
                      className="w-full px-2 py-1 border rounded"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Bitiş Saati</label>
                    <input
                      type="time"
                      value={timeRange.endTime}
                      onChange={(e) => onTimeRangeChange("endTime", e.target.value)}
                      className="w-full px-2 py-1 border rounded"
                    />
                  </div>
                </div>
              </div>
            </div>
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={onDateRangeChange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
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