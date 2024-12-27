import { Fragment } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { ChevronUpDown, Check } from "lucide-react";
import { DateRange } from "react-day-picker";
import { DateTimeRangePicker } from "@/components/reports/device-playback/DateTimeRangePicker";

interface SongFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedGenre: string;
  onGenreChange: (value: string) => void;
  genres: string[];
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
}

export const SongFilters = ({
  searchTerm,
  onSearchChange,
  selectedGenre,
  onGenreChange,
  genres,
  dateRange,
  onDateRangeChange,
}: SongFiltersProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
        <input
          type="text"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Şarkı veya sanatçı ara..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      
      <div className="w-[180px]">
        <Listbox value={selectedGenre} onChange={onGenreChange}>
          <div className="relative">
            <Listbox.Button className="relative w-full py-2 pl-3 pr-10 text-left bg-white border border-gray-300 rounded-lg cursor-default focus:outline-none focus:ring-2 focus:ring-blue-500">
              <span className="block truncate">
                {selectedGenre === 'all' ? 'Tüm Türler' : selectedGenre}
              </span>
              <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <ChevronUpDown className="w-5 h-5 text-gray-400" />
              </span>
            </Listbox.Button>
            <Transition
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="absolute w-full py-1 mt-1 overflow-auto text-base bg-white rounded-md shadow-lg max-h-60 ring-1 ring-black ring-opacity-5 focus:outline-none">
                {genres.map((genre) => (
                  <Listbox.Option
                    key={genre}
                    className={({ active }) =>
                      `${active ? 'text-white bg-blue-600' : 'text-gray-900'}
                      cursor-default select-none relative py-2 pl-10 pr-4`
                    }
                    value={genre}
                  >
                    {({ selected, active }) => (
                      <>
                        <span className={`${selected ? 'font-medium' : 'font-normal'} block truncate`}>
                          {genre === 'all' ? 'Tüm Türler' : genre}
                        </span>
                        {selected ? (
                          <span className={`${active ? 'text-white' : 'text-blue-600'} absolute inset-y-0 left-0 flex items-center pl-3`}>
                            <Check className="w-5 h-5" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        </Listbox>
      </div>

      <div className="w-[300px]">
        <DateTimeRangePicker
          dateRange={dateRange}
          timeRange={{ startTime: "00:00", endTime: "23:59" }}
          onDateRangeChange={onDateRangeChange}
          onTimeRangeChange={() => {}}
          showDownloadButton={false}
        />
      </div>
    </div>
  );
};