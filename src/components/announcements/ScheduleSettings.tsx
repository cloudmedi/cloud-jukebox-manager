import { useFormContext } from "react-hook-form";
import { DateRangePicker } from "./schedule/DateRangePicker";
import { ScheduleTypeSelector } from "./schedule/ScheduleTypeSelector";
import { SpecificTimeSelector } from "./schedule/SpecificTimeSelector";
import { InterruptToggle } from "./schedule/InterruptToggle";
import { AnnouncementFormData } from "./form/types";

export const ScheduleSettings = () => {
  const form = useFormContext<AnnouncementFormData>();
  const scheduleType = form.watch("scheduleType");

  return (
    <div className="space-y-6">
      <DateRangePicker />
      <ScheduleTypeSelector />
      {scheduleType === "specific" && <SpecificTimeSelector />}
      <InterruptToggle />
    </div>
  );
};