export const CalendarStyles = () => {
  return (
    <style>
      {`
        .event-animation {
          transition: all 0.3s ease;
          cursor: pointer;
        }
        .event-animation:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .fc-event {
          border-radius: 4px;
          border-left-width: 4px;
        }
        .fc-timegrid-event-harness {
          margin-left: 2px;
          margin-right: 2px;
        }
        .fc-timegrid-event {
          min-height: 25px !important;
        }
        .fc-event-main {
          padding: 4px;
        }
      `}
    </style>
  );
};