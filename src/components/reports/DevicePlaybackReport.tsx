import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePickerWithRange } from "@/components/ui/date-picker";
import { addDays } from "date-fns";
import { Download, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { jsPDF } from "jspdf"; 
import autoTable from "jspdf-autotable";
import { useToast } from "@/hooks/use-toast";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface PlaybackData {
  songName: string;
  artist: string;
  playCount: number;
  totalDuration: number;
  lastPlayed: string;
}

const DevicePlaybackReport = () => {
  const { toast } = useToast();
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState({
    from: new Date(),
    to: addDays(new Date(), 7),
  });
  const [timeRange, setTimeRange] = useState({
    startTime: "00:00",
    endTime: "23:59"
  });
  const [open, setOpen] = useState(false);

  // Cihazları getir
  const { data: devices, isLoading: devicesLoading } = useQuery({
    queryKey: ["devices"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/devices");
      if (!response.ok) throw new Error("Cihazlar yüklenemedi");
      return response.json();
    },
  });

  // Seçili cihazın çalma verilerini getir
  const { data: playbackData, isLoading: playbackLoading } = useQuery({
    queryKey: ["device-playback", selectedDevice, dateRange, timeRange],
    queryFn: async () => {
      if (!selectedDevice) return null;
      const response = await fetch(
        `http://localhost:5000/api/stats/device-playback?deviceId=${selectedDevice}&from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}&startTime=${timeRange.startTime}&endTime=${timeRange.endTime}`
      );
      if (!response.ok) throw new Error("Çalma verileri yüklenemedi");
      return response.json();
    },
    enabled: !!selectedDevice,
  });

  const filteredDevices = devices?.filter((device: any) =>
    device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    device.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const generatePDF = () => {
    const doc = new jsPDF();
    const deviceName = devices?.find((d: any) => d._id === selectedDevice)?.name || "Cihaz";
    
    doc.setFontSize(16);
    doc.text(`${deviceName} - Çalma Raporu`, 14, 15);
    doc.setFontSize(11);
    doc.text(`Tarih Aralığı: ${dateRange.from.toLocaleDateString()} ${timeRange.startTime} - ${dateRange.to.toLocaleDateString()} ${timeRange.endTime}`, 14, 25);

    const tableData = playbackData?.map((item: PlaybackData) => [
      item.songName,
      item.artist,
      item.playCount.toString(),
      Math.round(item.totalDuration / 60).toString() + " dk",
      new Date(item.lastPlayed).toLocaleDateString()
    ]);

    autoTable(doc, {
      head: [["Şarkı", "Sanatçı", "Çalınma Sayısı", "Toplam Süre", "Son Çalınma"]],
      body: tableData || [],
      startY: 35,
    });

    doc.save(`${deviceName}-calma-raporu-${new Date().toISOString().split('T')[0]}.pdf`);
    toast({
      title: "PDF oluşturuldu",
      description: "Rapor başarıyla indirildi.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cihaz Çalma Raporu</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
              >
                {selectedDevice
                  ? devices?.find((device: any) => device._id === selectedDevice)?.name
                  : "Cihaz seçin..."}
                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput
                  placeholder="Cihaz ara..."
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                />
                <CommandEmpty>Cihaz bulunamadı.</CommandEmpty>
                <CommandGroup className="max-h-[300px] overflow-auto">
                  {filteredDevices?.map((device: any) => (
                    <CommandItem
                      key={device._id}
                      value={device._id}
                      onSelect={(currentValue) => {
                        setSelectedDevice(currentValue);
                        setOpen(false);
                      }}
                    >
                      {device.name} - {device.location}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>

          <DatePickerWithRange
            date={dateRange}
            setDate={setDateRange}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Başlangıç Saati</label>
              <Input
                type="time"
                value={timeRange.startTime}
                onChange={(e) => setTimeRange(prev => ({ ...prev, startTime: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Bitiş Saati</label>
              <Input
                type="time"
                value={timeRange.endTime}
                onChange={(e) => setTimeRange(prev => ({ ...prev, endTime: e.target.value }))}
              />
            </div>
          </div>

          <Button
            onClick={generatePDF}
            disabled={!playbackData || playbackLoading}
            className="w-full md:w-auto"
          >
            <Download className="mr-2 h-4 w-4" />
            PDF İndir
          </Button>
        </div>

        {playbackLoading ? (
          <div className="flex items-center justify-center h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : playbackData ? (
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-2 text-left">Şarkı</th>
                  <th className="p-2 text-left">Sanatçı</th>
                  <th className="p-2 text-left">Çalınma Sayısı</th>
                  <th className="p-2 text-left">Toplam Süre</th>
                  <th className="p-2 text-left">Son Çalınma</th>
                </tr>
              </thead>
              <tbody>
                {playbackData.map((item: PlaybackData, index: number) => (
                  <tr key={index} className="border-b">
                    <td className="p-2">{item.songName}</td>
                    <td className="p-2">{item.artist}</td>
                    <td className="p-2">{item.playCount}</td>
                    <td className="p-2">{Math.round(item.totalDuration / 60)} dk</td>
                    <td className="p-2">
                      {new Date(item.lastPlayed).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default DevicePlaybackReport;
