import { CalendarIcon, Download } from "lucide-react";
import { DateRange } from "react-day-picker";
import { addDays, format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { tr } from "date-fns/locale";

interface TimeRange {
  startTime: string;
  endTime: string;
}

interface DateTimeRangePickerProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  timeRange: TimeRange;
  onTimeRangeChange: (timeRange: TimeRange) => void;
  showDownloadButton?: boolean;
  isDownloadDisabled?: boolean;
  onDownload?: () => void;
}

export function DateTimeRangePicker({
  dateRange,
  onDateRangeChange,
  timeRange,
  onTimeRangeChange,
  showDownloadButton,
  isDownloadDisabled,
  onDownload,
}: DateTimeRangePickerProps) {
  return (
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
                  {format(dateRange.from, "dd MMMM yyyy", { locale: tr })} -{" "}
                  {format(dateRange.to, "dd MMMM yyyy", { locale: tr })}
                </>
              ) : (
                format(dateRange.from, "dd MMMM yyyy", { locale: tr })
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
            selected={dateRange}
            onSelect={onDateRangeChange}
            numberOfMonths={2}
            locale={tr}
          />
        </PopoverContent>
      </Popover>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="startTime" className="text-sm font-medium">
            Başlangıç Saati
          </label>
          <input
            type="time"
            id="startTime"
            value={timeRange.startTime}
            onChange={(e) =>
              onTimeRangeChange({
                ...timeRange,
                startTime: e.target.value,
              })
            }
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="endTime" className="text-sm font-medium">
            Bitiş Saati
          </label>
          <input
            type="time"
            id="endTime"
            value={timeRange.endTime}
            onChange={(e) =>
              onTimeRangeChange({
                ...timeRange,
                endTime: e.target.value,
              })
            }
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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