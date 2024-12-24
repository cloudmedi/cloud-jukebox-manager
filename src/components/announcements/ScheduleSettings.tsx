import { UseFormReturn } from "react-hook-form";
import { DateRangePicker } from "./schedule/DateRangePicker";
import { ScheduleTypeSelector } from "./schedule/ScheduleTypeSelector";
import { SpecificTimeSelector } from "./schedule/SpecificTimeSelector";
import { InterruptToggle } from "./schedule/InterruptToggle";

interface ScheduleSettingsProps {
  form: UseFormReturn<any>;
}

export const ScheduleSettings = ({ form }: ScheduleSettingsProps) => {
  const scheduleType = form.watch("scheduleType");

  return (
    <div className="space-y-6">
      <DateRangePicker form={form} />
      <ScheduleTypeSelector form={form} />
      <SpecificTimeSelector form={form} visible={scheduleType === "specific"} />
      <InterruptToggle form={form} />
    </div>
  );
};