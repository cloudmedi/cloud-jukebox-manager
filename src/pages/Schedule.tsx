import { useState } from "react";
import { CalendarView } from "@/components/schedule/CalendarView";

const Schedule = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleDateSelect = (selectInfo: any) => {
    console.log("Date selected:", selectInfo);
  };

  const handleEventClick = (event: any) => {
    console.log("Event clicked:", event);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Schedule</h1>
      <CalendarView
        onDateSelect={handleDateSelect}
        onEventClick={handleEventClick}
        refreshTrigger={refreshTrigger}
      />
    </div>
  );
};

export default Schedule;